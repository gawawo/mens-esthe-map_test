"""
RAG（Retrieval-Augmented Generation）検索サービス
ベクトル検索とLLMを組み合わせた自然言語検索
"""

import logging
from typing import Optional
from uuid import UUID
from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.ai.embeddings import get_embedding_service
from app.ai.llm_client import get_gemini_client
from app.models.shop import Shop
from app.models.review import Review
from app.models.analytics import ShopAIAnalytics

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """検索結果"""
    shop_id: str
    shop_name: str
    relevance_score: float
    matched_reviews: list[dict]
    analytics: Optional[dict] = None


@dataclass
class ChatSearchResponse:
    """チャット検索レスポンス"""
    query: str
    answer: str
    results: list[SearchResult]
    total_results: int


class RAGSearchService:
    """RAG検索サービス"""

    def __init__(self, db: Session):
        self.db = db
        self.embedding_service = get_embedding_service()
        self.llm_client = get_gemini_client()

    async def vector_search(
        self,
        query: str,
        limit: int = 10,
        similarity_threshold: float = 0.5,
    ) -> list[dict]:
        """
        ベクトル類似度検索

        Args:
            query: 検索クエリ
            limit: 最大取得件数
            similarity_threshold: 類似度しきい値

        Returns:
            類似レビューのリスト
        """
        # クエリをベクトル化
        query_embedding = await self.embedding_service.generate_query_embedding(query)

        # ベクトルを文字列形式に変換（pgvector用）
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

        # pgvectorで類似検索
        sql = text("""
            SELECT
                r.id AS review_id,
                r.shop_id,
                r.text AS review_text,
                r.rating,
                s.name AS shop_name,
                s.formatted_address,
                1 - (r.embedding <=> CAST(:query_embedding AS vector)) AS similarity
            FROM reviews r
            JOIN shops s ON r.shop_id = s.id
            WHERE r.embedding IS NOT NULL
            ORDER BY r.embedding <=> CAST(:query_embedding AS vector)
            LIMIT :limit
        """)

        results = self.db.execute(
            sql,
            {
                "query_embedding": embedding_str,
                "limit": limit,
            },
        ).fetchall()

        # しきい値でフィルタ
        filtered_results = [
            {
                "review_id": str(r.review_id),
                "shop_id": str(r.shop_id),
                "review_text": r.review_text,
                "rating": r.rating,
                "shop_name": r.shop_name,
                "formatted_address": r.formatted_address,
                "similarity": float(r.similarity),
            }
            for r in results
            if r.similarity >= similarity_threshold
        ]

        return filtered_results

    async def search_shops_by_query(
        self,
        query: str,
        limit: int = 5,
    ) -> list[SearchResult]:
        """
        自然言語クエリで店舗を検索

        Args:
            query: 検索クエリ
            limit: 最大店舗数

        Returns:
            関連店舗のリスト
        """
        # ベクトル検索で関連レビューを取得
        similar_reviews = await self.vector_search(query, limit=limit * 3)

        if not similar_reviews:
            return []

        # 店舗ごとにグループ化
        shop_results: dict[str, SearchResult] = {}

        for review in similar_reviews:
            shop_id = review["shop_id"]

            if shop_id not in shop_results:
                # 解析結果を取得
                analytics = (
                    self.db.query(ShopAIAnalytics)
                    .filter(ShopAIAnalytics.shop_id == shop_id)
                    .first()
                )

                analytics_dict = None
                if analytics:
                    analytics_dict = {
                        "risk_level": analytics.risk_level,
                        "score_operation": analytics.score_operation,
                        "score_accuracy": analytics.score_accuracy,
                        "score_hygiene": analytics.score_hygiene,
                        "score_sincerity": analytics.score_sincerity,
                        "score_safety": analytics.score_safety,
                        "sakura_risk": analytics.sakura_risk,
                        "risk_summary": analytics.risk_summary,
                    }

                shop_results[shop_id] = SearchResult(
                    shop_id=shop_id,
                    shop_name=review["shop_name"],
                    relevance_score=review["similarity"],
                    matched_reviews=[],
                    analytics=analytics_dict,
                )

            # レビューを追加
            shop_results[shop_id].matched_reviews.append({
                "text": review["review_text"],
                "rating": review["rating"],
                "similarity": review["similarity"],
            })

            # 最高の類似度を保持
            if review["similarity"] > shop_results[shop_id].relevance_score:
                shop_results[shop_id].relevance_score = review["similarity"]

        # 関連度でソート
        sorted_results = sorted(
            shop_results.values(),
            key=lambda x: x.relevance_score,
            reverse=True,
        )

        return sorted_results[:limit]

    async def chat_search(
        self,
        query: str,
        limit: int = 5,
    ) -> ChatSearchResponse:
        """
        チャット形式の検索

        Args:
            query: ユーザーの質問/検索クエリ
            limit: 最大店舗数

        Returns:
            回答と関連店舗
        """
        # 店舗検索
        results = await self.search_shops_by_query(query, limit=limit)

        if not results:
            return ChatSearchResponse(
                query=query,
                answer="申し訳ありません。条件に合う店舗が見つかりませんでした。別の条件で検索してみてください。",
                results=[],
                total_results=0,
            )

        # LLMで回答を生成
        answer = await self._generate_answer(query, results)

        return ChatSearchResponse(
            query=query,
            answer=answer,
            results=results,
            total_results=len(results),
        )

    async def _generate_answer(
        self,
        query: str,
        results: list[SearchResult],
    ) -> str:
        """
        検索結果を元にLLMで回答を生成
        """
        # コンテキストを構築
        context_parts = []

        for i, result in enumerate(results, 1):
            shop_info = f"【店舗{i}】{result.shop_name}"

            if result.analytics:
                analytics = result.analytics
                shop_info += f"\n- リスクレベル: {analytics.get('risk_level', '不明')}"
                if analytics.get('risk_summary'):
                    shop_info += f"\n- AI評価: {analytics['risk_summary']}"

            shop_info += "\n- 関連レビュー:"
            for j, review in enumerate(result.matched_reviews[:3], 1):
                rating = f"★{review['rating']}" if review['rating'] else ""
                shop_info += f"\n  {j}. {rating} {review['text'][:100]}..."

            context_parts.append(shop_info)

        context = "\n\n".join(context_parts)

        prompt = f"""あなたはメンズエステ店の検索アシスタントです。
ユーザーの質問に対して、検索結果を元に簡潔で有用な回答を提供してください。

## ユーザーの質問
{query}

## 検索結果
{context}

## 回答のガイドライン
- 簡潔に（3-5文程度）
- 具体的な店舗名を挙げて推薦
- リスク情報があれば言及
- サクラ疑惑が高い店舗は注意喚起
- 嘘や推測は避け、検索結果に基づいて回答

回答:"""

        try:
            answer = await self.llm_client.generate(prompt)
            return answer.strip()
        except Exception as e:
            logger.error(f"Answer generation failed: {e}")
            # フォールバック回答
            shop_names = ", ".join([r.shop_name for r in results[:3]])
            return f"条件に合いそうな店舗として「{shop_names}」が見つかりました。詳細は各店舗の情報をご確認ください。"


class StructuredSearchService:
    """構造化検索サービス（キーワードベース）"""

    def __init__(self, db: Session):
        self.db = db

    def search_by_criteria(
        self,
        min_score: Optional[int] = None,
        max_sakura_risk: Optional[int] = None,
        risk_levels: Optional[list[str]] = None,
        min_rating: Optional[float] = None,
        limit: int = 20,
    ) -> list[Shop]:
        """
        構造化条件で店舗を検索

        Args:
            min_score: 最低平均スコア
            max_sakura_risk: 最大サクラリスク
            risk_levels: リスクレベルフィルタ
            min_rating: 最低Google評価
            limit: 最大件数
        """
        query = (
            self.db.query(Shop)
            .outerjoin(ShopAIAnalytics)
        )

        if min_rating is not None:
            query = query.filter(Shop.rating >= min_rating)

        if risk_levels:
            query = query.filter(ShopAIAnalytics.risk_level.in_(risk_levels))

        if max_sakura_risk is not None:
            query = query.filter(ShopAIAnalytics.sakura_risk <= max_sakura_risk)

        if min_score is not None:
            # 平均スコアでフィルタ
            query = query.filter(
                (
                    ShopAIAnalytics.score_operation +
                    ShopAIAnalytics.score_accuracy +
                    ShopAIAnalytics.score_hygiene +
                    ShopAIAnalytics.score_sincerity +
                    ShopAIAnalytics.score_safety
                ) / 5 >= min_score
            )

        return query.limit(limit).all()

    def parse_query_to_criteria(self, query: str) -> dict:
        """
        自然言語クエリを構造化条件に変換（簡易実装）

        Args:
            query: 自然言語クエリ

        Returns:
            検索条件の辞書
        """
        criteria = {}

        # キーワードマッチング
        query_lower = query.lower()

        # 安全性
        if any(word in query_lower for word in ["安全", "安心", "リスク低", "地雷なし"]):
            criteria["risk_levels"] = ["safe"]
            criteria["max_sakura_risk"] = 30

        # サクラ対策
        if any(word in query_lower for word in ["サクラ", "さくら", "やらせ", "本物"]):
            criteria["max_sakura_risk"] = 20

        # 高評価
        if any(word in query_lower for word in ["高評価", "人気", "おすすめ", "評判"]):
            criteria["min_rating"] = 4.0
            criteria["min_score"] = 7

        # 穴場
        if any(word in query_lower for word in ["穴場", "隠れ家", "知る人ぞ知る"]):
            criteria["risk_levels"] = ["gamble"]

        return criteria
