"""
ベクトル埋め込み生成
レビューのベクトル化とpgvectorへの保存
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

import google.generativeai as genai
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.models.review import Review

logger = logging.getLogger(__name__)


class EmbeddingService:
    """ベクトル埋め込みサービス"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.gemini_api_key
        genai.configure(api_key=self.api_key)
        self.model = "models/text-embedding-004"
        self.dimension = 768  # text-embedding-004の次元数

    def generate_embedding_sync(self, text: str) -> list[float]:
        """
        テキストのベクトル埋め込みを生成（同期版）
        """
        try:
            result = genai.embed_content(
                model=self.model,
                content=text,
                task_type="retrieval_document",
            )
            return result["embedding"]
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise

    async def generate_embedding(self, text: str) -> list[float]:
        """
        テキストのベクトル埋め込みを生成
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.generate_embedding_sync, text)

    def generate_query_embedding_sync(self, query: str) -> list[float]:
        """
        検索クエリのベクトル埋め込みを生成（同期版）
        """
        try:
            result = genai.embed_content(
                model=self.model,
                content=query,
                task_type="retrieval_query",
            )
            return result["embedding"]
        except Exception as e:
            logger.error(f"Query embedding generation failed: {e}")
            raise

    async def generate_query_embedding(self, query: str) -> list[float]:
        """
        検索クエリのベクトル埋め込みを生成
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.generate_query_embedding_sync, query)

    def batch_generate_embeddings_sync(
        self,
        texts: list[str],
        batch_size: int = 100,
    ) -> list[list[float]]:
        """
        複数テキストのベクトル埋め込みを一括生成（同期版）
        """
        embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            try:
                result = genai.embed_content(
                    model=self.model,
                    content=batch,
                    task_type="retrieval_document",
                )
                # 単一テキストの場合はリストでラップ
                if isinstance(result["embedding"][0], float):
                    embeddings.append(result["embedding"])
                else:
                    embeddings.extend(result["embedding"])
            except Exception as e:
                logger.error(f"Batch embedding failed for batch {i}: {e}")
                # 失敗したバッチは空ベクトルで埋める
                embeddings.extend([[0.0] * self.dimension] * len(batch))

        return embeddings

    async def batch_generate_embeddings(
        self,
        texts: list[str],
        batch_size: int = 100,
    ) -> list[list[float]]:
        """
        複数テキストのベクトル埋め込みを一括生成
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self.batch_generate_embeddings_sync, texts, batch_size
        )


@dataclass
class EmbeddingBatchResult:
    """埋め込みバッチ処理結果"""

    total_reviews: int
    embedded: int
    skipped: int
    failed: int
    errors: list[str]


class ReviewEmbeddingService:
    """レビュー埋め込みサービス"""

    def __init__(self, db: Session):
        self.db = db
        self.embedding_service = get_embedding_service()

    def get_reviews_without_embedding(self, limit: int = 100) -> list[Review]:
        """埋め込みがないレビューを取得"""
        return (
            self.db.query(Review)
            .filter(Review.embedding.is_(None))
            .filter(Review.text.isnot(None))
            .filter(Review.text != "")
            .limit(limit)
            .all()
        )

    async def embed_reviews(
        self,
        review_ids: Optional[list[UUID]] = None,
        limit: int = 100,
    ) -> EmbeddingBatchResult:
        """
        レビューにベクトル埋め込みを生成して保存

        Args:
            review_ids: 対象レビューID（省略時は埋め込みがないレビューを対象）
            limit: 処理する最大レビュー数
        """
        result = EmbeddingBatchResult(
            total_reviews=0,
            embedded=0,
            skipped=0,
            failed=0,
            errors=[],
        )

        # 対象レビューを取得
        if review_ids:
            reviews = self.db.query(Review).filter(Review.id.in_(review_ids)).all()
        else:
            reviews = self.get_reviews_without_embedding(limit)

        result.total_reviews = len(reviews)

        if not reviews:
            logger.info("No reviews to embed")
            return result

        # テキストを抽出
        texts = []
        valid_reviews = []
        for review in reviews:
            if review.text and len(review.text.strip()) > 0:
                texts.append(review.text)
                valid_reviews.append(review)
            else:
                result.skipped += 1

        if not texts:
            return result

        logger.info(f"Generating embeddings for {len(texts)} reviews")

        try:
            # 埋め込みを生成
            embeddings = await self.embedding_service.batch_generate_embeddings(texts)

            # DBに保存
            for review, embedding in zip(valid_reviews, embeddings):
                try:
                    # pgvector形式で保存
                    self.db.execute(
                        text("UPDATE reviews SET embedding = :embedding WHERE id = :id"),
                        {"embedding": embedding, "id": str(review.id)},
                    )
                    result.embedded += 1
                except Exception as e:
                    result.failed += 1
                    result.errors.append(f"Review {review.id}: {str(e)}")

            self.db.commit()
            logger.info(f"Embedded {result.embedded} reviews")

        except Exception as e:
            result.failed = len(valid_reviews)
            result.errors.append(f"Batch embedding failed: {str(e)}")
            logger.error(f"Embedding batch failed: {e}")

        return result

    async def embed_shop_reviews(self, shop_id: UUID) -> EmbeddingBatchResult:
        """特定店舗のレビューを埋め込み"""
        reviews = (
            self.db.query(Review)
            .filter(Review.shop_id == shop_id)
            .filter(Review.embedding.is_(None))
            .all()
        )

        review_ids = [r.id for r in reviews]
        return await self.embed_reviews(review_ids=review_ids)


# シングルトンインスタンス
_embedding_service: Optional[EmbeddingService] = None


def get_embedding_service() -> EmbeddingService:
    """埋め込みサービスのシングルトンを取得"""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
