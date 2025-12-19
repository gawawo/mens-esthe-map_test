"""
Apify Google Maps Reviews Scraper クライアント
Google Places APIの5件制限を超えて全レビューを取得
"""

import logging
from datetime import datetime
from typing import Optional

from apify_client import ApifyClientAsync

from app.config import settings

logger = logging.getLogger(__name__)


class ApifyReviewsService:
    """Apifyを使用してGoogle Mapsレビューを取得するサービス"""

    ACTOR_ID = "compass/google-maps-reviews-scraper"

    def __init__(self):
        if not settings.apify_api_token:
            raise ValueError("APIFY_API_TOKEN is not set")
        self.client = ApifyClientAsync(settings.apify_api_token)

    async def fetch_reviews(
        self,
        place_url: str,
        max_reviews: int = 100,
        language: str = "ja",
    ) -> list[dict]:
        """
        Google Maps URLからレビュー全件取得

        Args:
            place_url: Google MapsのURL (place_id形式も可)
            max_reviews: 取得する最大レビュー数
            language: レビューの言語

        Returns:
            正規化されたレビューデータのリスト
        """
        run_input = {
            "startUrls": [{"url": place_url}],
            "maxReviews": max_reviews,
            "language": language,
            "reviewsSort": "newest",
        }

        logger.info(f"Fetching reviews from Apify: {place_url}, max={max_reviews}")

        try:
            # Actorを実行
            run = await self.client.actor(self.ACTOR_ID).call(run_input=run_input)

            # データセットからレビューを取得
            reviews = []
            async for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                normalized = self._normalize_review(item)
                if normalized:
                    reviews.append(normalized)

            logger.info(f"Fetched {len(reviews)} reviews from Apify")
            return reviews

        except Exception as e:
            logger.error(f"Apify fetch error: {e}")
            raise

    async def fetch_reviews_by_place_id(
        self,
        place_id: str,
        max_reviews: int = 100,
        language: str = "ja",
    ) -> list[dict]:
        """
        Google Place IDからレビューを取得

        Args:
            place_id: Google Place ID (例: ChIJ...)
            max_reviews: 取得する最大レビュー数
            language: レビューの言語

        Returns:
            正規化されたレビューデータのリスト
        """
        # Place IDからGoogle Maps URLを生成
        place_url = f"https://www.google.com/maps/place/?q=place_id:{place_id}"
        return await self.fetch_reviews(place_url, max_reviews, language)

    def _normalize_review(self, item: dict) -> Optional[dict]:
        """
        Apifyレスポンスを既存のReviewモデル形式に変換

        Args:
            item: Apifyからの生レビューデータ

        Returns:
            正規化されたレビューデータ、無効な場合はNone
        """
        # レビューテキストを取得（複数の可能なキー名に対応）
        text = (
            item.get("text")
            or item.get("reviewText")
            or item.get("review_text")
            or ""
        )

        # 評価を取得
        rating = item.get("stars") or item.get("rating")
        if rating is None:
            return None  # 評価がないレビューはスキップ

        # 投稿者名を取得
        author_name = (
            item.get("name")
            or item.get("reviewer_name")
            or item.get("reviewerName")
            or "Anonymous"
        )

        # 投稿時刻を解析
        time_value = self._parse_time(item)

        return {
            "author_name": author_name,
            "author_url": item.get("reviewerUrl") or item.get("reviewer_profile_url"),
            "profile_photo_url": item.get("reviewerPhotoUrl"),
            "rating": int(rating) if rating else None,
            "text": text,
            "language": "ja",  # Apifyで日本語指定済み
            "relative_time_description": (
                item.get("publishedAtDate")
                or item.get("published_date_string")
                or item.get("relativeDate")
            ),
            "time": time_value,
            "raw_data": item,
        }

    def _parse_time(self, item: dict) -> Optional[int]:
        """
        投稿時刻をUnixタイムスタンプに変換

        Args:
            item: レビューデータ

        Returns:
            Unixタイムスタンプ（ミリ秒）、解析できない場合はNone
        """
        # 複数の日付フィールドを試行
        date_str = (
            item.get("publishedAtDate")
            or item.get("published_date")
            or item.get("reviewDate")
        )

        if not date_str:
            return None

        try:
            # ISO形式の日付をパース
            if isinstance(date_str, str):
                # "2024-01-15" または "2024-01-15T10:30:00Z" 形式
                if "T" in date_str:
                    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                else:
                    dt = datetime.strptime(date_str, "%Y-%m-%d")
                return int(dt.timestamp() * 1000)  # ミリ秒
            elif isinstance(date_str, (int, float)):
                return int(date_str)
        except (ValueError, TypeError) as e:
            logger.warning(f"Failed to parse date: {date_str}, error: {e}")

        return None
