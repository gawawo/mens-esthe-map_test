from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.review import Review
from app.schemas.review import ReviewCreate


class ReviewService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, review_id: UUID) -> Optional[Review]:
        """IDでレビューを取得"""
        return self.db.query(Review).filter(Review.id == review_id).first()

    def get_by_shop_id(
        self,
        shop_id: UUID,
        limit: int = 50,
        language: Optional[str] = None,
    ) -> list[Review]:
        """店舗IDでレビュー一覧を取得

        Args:
            shop_id: 店舗ID
            limit: 取得件数上限
            language: 言語コード（"ja"=日本語のみ, None=全言語）
        """
        query = self.db.query(Review).filter(Review.shop_id == shop_id)

        if language:
            query = query.filter(Review.language == language)

        return query.order_by(Review.time.desc()).limit(limit).all()

    def update_text_ja(self, review_id: UUID, text_ja: str) -> Optional[Review]:
        """レビューの日本語翻訳テキストを更新"""
        review = self.get_by_id(review_id)
        if review:
            review.text_ja = text_ja
            self.db.commit()
            self.db.refresh(review)
        return review

    def get_reviews_without_translation(self, limit: int = 100) -> list[Review]:
        """翻訳がないレビューを取得（日本語以外）"""
        return (
            self.db.query(Review)
            .filter(Review.text_ja.is_(None))
            .filter(Review.text.isnot(None))
            .filter(Review.text != "")
            .filter(Review.language != "ja")
            .limit(limit)
            .all()
        )

    def get_by_shop_and_author(self, shop_id: UUID, author_name: str, time: int) -> Optional[Review]:
        """店舗ID、著者名、投稿時刻でレビューを検索（重複チェック用）"""
        return (
            self.db.query(Review)
            .filter(
                Review.shop_id == shop_id,
                Review.author_name == author_name,
                Review.time == time,
            )
            .first()
        )

    def create(self, review_data: ReviewCreate) -> Review:
        """新規レビューを作成"""
        review = Review(
            shop_id=review_data.shop_id,
            author_name=review_data.author_name,
            author_url=review_data.author_url,
            profile_photo_url=review_data.profile_photo_url,
            rating=review_data.rating,
            text=review_data.text,
            language=review_data.language,
            relative_time_description=review_data.relative_time_description,
            time=review_data.time,
            raw_data=review_data.raw_data,
        )

        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def bulk_create(self, shop_id: UUID, reviews_data: list[dict]) -> list[Review]:
        """レビューを一括作成（重複チェック付き）"""
        created_reviews = []

        for review_data in reviews_data:
            # 重複チェック
            existing = self.get_by_shop_and_author(
                shop_id=shop_id,
                author_name=review_data.get("author_name", ""),
                time=review_data.get("time", 0),
            )

            if existing:
                continue  # 既存レビューはスキップ

            review = Review(
                shop_id=shop_id,
                author_name=review_data.get("author_name"),
                author_url=review_data.get("author_url"),
                profile_photo_url=review_data.get("profile_photo_url"),
                rating=review_data.get("rating"),
                text=review_data.get("text"),
                language=review_data.get("language"),
                relative_time_description=review_data.get("relative_time_description"),
                time=review_data.get("time"),
                raw_data=review_data.get("raw_data"),
            )
            self.db.add(review)
            created_reviews.append(review)

        if created_reviews:
            self.db.commit()
            for review in created_reviews:
                self.db.refresh(review)

        return created_reviews

    def delete_by_shop_id(self, shop_id: UUID) -> int:
        """店舗のレビューを全削除"""
        deleted_count = (
            self.db.query(Review)
            .filter(Review.shop_id == shop_id)
            .delete()
        )
        self.db.commit()
        return deleted_count

    def count_by_shop_id(self, shop_id: UUID) -> int:
        """店舗のレビュー数をカウント"""
        return (
            self.db.query(Review)
            .filter(Review.shop_id == shop_id)
            .count()
        )
