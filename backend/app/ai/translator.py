"""
レビュー翻訳サービス
Gemini APIを使用してレビューを日本語に翻訳
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Optional

from app.ai.llm_client import get_gemini_client

logger = logging.getLogger(__name__)


@dataclass
class TranslationResult:
    """翻訳結果"""

    original_text: str
    translated_text: str
    source_language: str


class TranslatorService:
    """翻訳サービス"""

    def __init__(self):
        self.client = get_gemini_client()

    async def translate_to_japanese(
        self,
        text: str,
        source_language: Optional[str] = None,
    ) -> str:
        """
        テキストを日本語に翻訳

        Args:
            text: 翻訳するテキスト
            source_language: 元の言語（オプション）

        Returns:
            日本語に翻訳されたテキスト
        """
        if not text or not text.strip():
            return ""

        # 既に日本語の場合はそのまま返す
        if source_language == "ja":
            return text

        prompt = f"""以下のレビューテキストを自然な日本語に翻訳してください。
翻訳のみを出力し、説明や補足は不要です。

レビュー:
{text}

日本語翻訳:"""

        try:
            translated = await self.client.generate(prompt)
            return translated.strip()
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            # 翻訳失敗時は元のテキストを返す
            return text

    async def batch_translate_to_japanese(
        self,
        texts: list[tuple[str, Optional[str]]],  # (text, language) のリスト
        batch_size: int = 5,
    ) -> list[str]:
        """
        複数テキストを一括で日本語に翻訳

        Args:
            texts: (テキスト, 言語コード) のタプルリスト
            batch_size: 同時処理数

        Returns:
            翻訳されたテキストのリスト
        """
        results = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            tasks = [self.translate_to_japanese(text, lang) for text, lang in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            for j, result in enumerate(batch_results):
                if isinstance(result, Exception):
                    logger.error(f"Translation error: {result}")
                    results.append(batch[j][0])  # 元のテキストを使用
                else:
                    results.append(result)

            # レート制限対策
            if i + batch_size < len(texts):
                await asyncio.sleep(0.5)

        return results


# シングルトンインスタンス
_translator: Optional[TranslatorService] = None


def get_translator_service() -> TranslatorService:
    """翻訳サービスのシングルトンを取得"""
    global _translator
    if _translator is None:
        _translator = TranslatorService()
    return _translator
