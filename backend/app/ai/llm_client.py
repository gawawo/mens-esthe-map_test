import json
import logging
from typing import Optional, Type, TypeVar

import google.generativeai as genai
from pydantic import BaseModel
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class GeminiClient:
    """Gemini API クライアント"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.gemini_api_key
        genai.configure(api_key=self.api_key)

        # モデル設定
        model_name = "gemini-2.5-flash"

        self.model = genai.GenerativeModel(
            model_name=model_name,
            generation_config={
                "temperature": 0.3,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 4096,
            },
        )

        # JSON出力用モデル（JSON modeを使用）
        self.json_model = genai.GenerativeModel(
            model_name=model_name,
            generation_config={
                "temperature": 0.2,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
                "response_mime_type": "application/json",
            },
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((Exception,)),
    )
    async def generate(self, prompt: str) -> str:
        """
        テキスト生成

        Args:
            prompt: プロンプト

        Returns:
            生成されたテキスト
        """
        try:
            response = await self.model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((Exception,)),
    )
    async def generate_json(
        self,
        prompt: str,
        response_schema: Optional[Type[T]] = None,
    ) -> dict:
        """
        JSON形式でテキスト生成

        Args:
            prompt: プロンプト
            response_schema: レスポンスのPydanticスキーマ（バリデーション用）

        Returns:
            パースされたJSONオブジェクト
        """
        try:
            response = await self.json_model.generate_content_async(prompt)
            text = response.text

            # レスポンスの長さをログ
            logger.debug(f"Response length: {len(text)} chars")

            # JSONパース（まず直接、失敗したら抽出を試みる）
            try:
                parsed = json.loads(text)
            except json.JSONDecodeError as e:
                logger.info(f"Direct JSON parse failed: {e}, trying extraction")
                logger.debug(f"Response ends with: ...{text[-100:]}")
                parsed = self._extract_json_from_text(text)

            # スキーマバリデーション（オプション）
            if response_schema:
                validated = response_schema.model_validate(parsed)
                return validated.model_dump()

            return parsed

        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            raise ValueError(f"Failed to parse JSON response: {e}")
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise

    def _extract_json_from_text(self, text: str) -> dict:
        """
        テキストからJSON部分を抽出（フォールバック用）
        """
        import re

        # ```json ... ``` パターンを検索（貪欲マッチ）
        json_match = re.search(r"```json\s*([\s\S]*?)\s*```", text)
        if json_match:
            json_str = json_match.group(1).strip()
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                # JSONの修復を試みる（末尾のカンマ削除など）
                json_str = self._fix_json(json_str)
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    pass

        # ``` ... ``` パターン（言語指定なし）
        json_match = re.search(r"```\s*([\s\S]*?)\s*```", text)
        if json_match:
            json_str = json_match.group(1).strip()
            if json_str.startswith("{"):
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    json_str = self._fix_json(json_str)
                    try:
                        return json.loads(json_str)
                    except json.JSONDecodeError:
                        pass

        # { で始まり } で終わる最大のブロックを検索
        json_match = re.search(r"\{[\s\S]*\}", text)
        if json_match:
            json_str = json_match.group()
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                json_str = self._fix_json(json_str)
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    pass

        raise ValueError(f"Could not extract JSON from response: {text[:200]}...")

    def _fix_json(self, json_str: str) -> str:
        """
        よくあるJSON形式エラーを修正
        """
        import re

        # 末尾のカンマを削除（配列・オブジェクト内）
        json_str = re.sub(r",\s*}", "}", json_str)
        json_str = re.sub(r",\s*]", "]", json_str)

        # 制御文字を削除
        json_str = re.sub(r"[\x00-\x1f\x7f]", "", json_str)

        return json_str

    async def count_tokens(self, text: str) -> int:
        """
        トークン数をカウント

        Args:
            text: カウント対象のテキスト

        Returns:
            トークン数
        """
        try:
            result = self.model.count_tokens(text)
            return result.total_tokens
        except Exception as e:
            logger.warning(f"Token count error: {e}")
            # フォールバック: 概算（日本語は1文字≒1トークン）
            return len(text)


# シングルトンインスタンス
_client: Optional[GeminiClient] = None


def get_gemini_client() -> GeminiClient:
    """Geminiクライアントのシングルトンを取得"""
    global _client
    if _client is None:
        _client = GeminiClient()
    return _client
