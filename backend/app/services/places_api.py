import httpx
from typing import Optional
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings


class PlacesAPIClient:
    """Google Places API (New) クライアント"""

    BASE_URL = "https://places.googleapis.com/v1"

    def __init__(self):
        self.api_key = settings.google_places_api_key
        self.headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
        }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def search_nearby(
        self,
        latitude: float,
        longitude: float,
        radius: float = 1000.0,
        included_types: Optional[list[str]] = None,
        keyword: Optional[str] = None,
        max_results: int = 20,
    ) -> dict:
        """
        Nearby Search (New) APIを使用して近隣店舗を検索

        Args:
            latitude: 中心緯度
            longitude: 中心経度
            radius: 検索半径（メートル）
            included_types: 検索対象のタイプ（例: ["spa", "beauty_salon"]）
            keyword: 検索キーワード
            max_results: 最大取得件数
        """
        if included_types is None:
            included_types = ["spa", "beauty_salon", "massage"]

        # Field Maskで取得するフィールドを指定
        field_mask = [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.location",
            "places.rating",
            "places.userRatingCount",
            "places.priceLevel",
            "places.businessStatus",
            "places.currentOpeningHours",
            "places.nationalPhoneNumber",
            "places.websiteUri",
        ]

        request_body = {
            "includedTypes": included_types,
            "maxResultCount": max_results,
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": latitude, "longitude": longitude},
                    "radius": radius,
                }
            },
        }

        # キーワードが指定されている場合はText Searchを使用
        if keyword:
            return await self.text_search(
                query=keyword,
                latitude=latitude,
                longitude=longitude,
                radius=radius,
                max_results=max_results,
            )

        headers = {
            **self.headers,
            "X-Goog-FieldMask": ",".join(field_mask),
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/places:searchNearby",
                json=request_body,
                headers=headers,
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def text_search(
        self,
        query: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius: float = 1000.0,
        max_results: int = 20,
    ) -> dict:
        """
        Text Search (New) APIを使用してキーワード検索

        Args:
            query: 検索クエリ（例: "新宿 メンズエステ"）
            latitude: 中心緯度（オプション）
            longitude: 中心経度（オプション）
            radius: 検索半径（メートル）
            max_results: 最大取得件数
        """
        field_mask = [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.location",
            "places.rating",
            "places.userRatingCount",
            "places.priceLevel",
            "places.businessStatus",
            "places.currentOpeningHours",
            "places.nationalPhoneNumber",
            "places.websiteUri",
        ]

        request_body = {
            "textQuery": query,
            "maxResultCount": max_results,
        }

        if latitude is not None and longitude is not None:
            request_body["locationBias"] = {
                "circle": {
                    "center": {"latitude": latitude, "longitude": longitude},
                    "radius": radius,
                }
            }

        headers = {
            **self.headers,
            "X-Goog-FieldMask": ",".join(field_mask),
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/places:searchText",
                json=request_body,
                headers=headers,
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def get_place_details(self, place_id: str, language_code: str = "ja") -> dict:
        """
        Place Details (New) APIを使用して店舗詳細とレビューを取得

        Args:
            place_id: Google Place ID
            language_code: レスポンスの言語コード（デフォルト: 日本語）
        """
        field_mask = [
            "id",
            "displayName",
            "formattedAddress",
            "location",
            "rating",
            "userRatingCount",
            "priceLevel",
            "businessStatus",
            "currentOpeningHours",
            "regularOpeningHours",
            "nationalPhoneNumber",
            "internationalPhoneNumber",
            "websiteUri",
            "reviews",
            "photos",
        ]

        headers = {
            **self.headers,
            "X-Goog-FieldMask": ",".join(field_mask),
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/places/{place_id}",
                headers=headers,
                params={"languageCode": language_code},
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()

    def parse_place_to_shop_data(self, place: dict) -> dict:
        """
        Places API レスポンスを Shop モデル用のデータに変換
        """
        location = place.get("location", {})

        # 営業時間の整形
        opening_hours = None
        if "currentOpeningHours" in place:
            opening_hours = place["currentOpeningHours"]
        elif "regularOpeningHours" in place:
            opening_hours = place["regularOpeningHours"]

        return {
            "place_id": place.get("id", ""),
            "name": place.get("displayName", {}).get("text", ""),
            "formatted_address": place.get("formattedAddress", ""),
            "latitude": location.get("latitude", 0),
            "longitude": location.get("longitude", 0),
            "rating": place.get("rating"),
            "user_ratings_total": place.get("userRatingCount"),
            "price_level": self._parse_price_level(place.get("priceLevel")),
            "business_status": place.get("businessStatus"),
            "opening_hours": opening_hours,
            "phone_number": place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber"),
            "website": place.get("websiteUri"),
            "raw_data": place,
        }

    def parse_reviews(self, place: dict) -> list[dict]:
        """
        Places API レスポンスからレビューデータを抽出
        """
        reviews = place.get("reviews", [])
        parsed_reviews = []

        for review in reviews:
            parsed_reviews.append({
                "author_name": review.get("authorAttribution", {}).get("displayName"),
                "author_url": review.get("authorAttribution", {}).get("uri"),
                "profile_photo_url": review.get("authorAttribution", {}).get("photoUri"),
                "rating": review.get("rating"),
                "text": review.get("text", {}).get("text", ""),
                "language": review.get("text", {}).get("languageCode"),
                "relative_time_description": review.get("relativePublishTimeDescription"),
                "time": self._parse_publish_time(review.get("publishTime")),
                "raw_data": review,
            })

        return parsed_reviews

    def _parse_price_level(self, price_level: Optional[str]) -> Optional[int]:
        """価格レベル文字列を数値に変換"""
        if price_level is None:
            return None
        price_map = {
            "PRICE_LEVEL_FREE": 0,
            "PRICE_LEVEL_INEXPENSIVE": 1,
            "PRICE_LEVEL_MODERATE": 2,
            "PRICE_LEVEL_EXPENSIVE": 3,
            "PRICE_LEVEL_VERY_EXPENSIVE": 4,
        }
        return price_map.get(price_level)

    def _parse_publish_time(self, publish_time: Optional[str]) -> Optional[int]:
        """ISO 8601形式の日時をUnix timestampに変換"""
        if publish_time is None:
            return None
        from datetime import datetime
        try:
            dt = datetime.fromisoformat(publish_time.replace("Z", "+00:00"))
            return int(dt.timestamp())
        except (ValueError, AttributeError):
            return None
