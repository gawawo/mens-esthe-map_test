import asyncio
import logging
from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.schemas.shop import ShopCreate
from app.services.places_api import PlacesAPIClient
from app.services.review_service import ReviewService
from app.services.shop_service import ShopService

logger = logging.getLogger(__name__)


@dataclass
class AreaDefinition:
    """エリア定義"""

    name: str
    latitude: float
    longitude: float
    radius: float = 1000.0  # メートル
    keywords: list[str] = None

    def __post_init__(self):
        if self.keywords is None:
            self.keywords = ["メンズエステ", "メンズ リラクゼーション"]


# 事前定義エリア
PREDEFINED_AREAS = {
    "shinjuku": AreaDefinition(
        name="新宿",
        latitude=35.6938,
        longitude=139.7034,
        radius=1500.0,
    ),
    "shibuya": AreaDefinition(
        name="渋谷",
        latitude=35.6580,
        longitude=139.7016,
        radius=1000.0,
    ),
    "ikebukuro": AreaDefinition(
        name="池袋",
        latitude=35.7295,
        longitude=139.7109,
        radius=1000.0,
    ),
    "ueno": AreaDefinition(
        name="上野",
        latitude=35.7141,
        longitude=139.7774,
        radius=1000.0,
    ),
    "akihabara": AreaDefinition(
        name="秋葉原",
        latitude=35.6984,
        longitude=139.7731,
        radius=800.0,
    ),
}


@dataclass
class IngestionResult:
    """取込結果"""

    area_name: str
    shops_found: int
    shops_created: int
    shops_updated: int
    reviews_created: int
    errors: list[str]


class IngestionService:
    """データ取込サービス"""

    def __init__(self, db: Session):
        self.db = db
        self.places_client = PlacesAPIClient()
        self.shop_service = ShopService(db)
        self.review_service = ReviewService(db)

    async def ingest_area(
        self,
        area_key: Optional[str] = None,
        area: Optional[AreaDefinition] = None,
        fetch_reviews: bool = True,
    ) -> IngestionResult:
        """
        指定エリアの店舗データを取込

        Args:
            area_key: 事前定義エリアのキー（例: "shinjuku"）
            area: カスタムエリア定義（area_keyより優先）
            fetch_reviews: レビューも取得するか
        """
        if area is None:
            if area_key is None or area_key not in PREDEFINED_AREAS:
                raise ValueError(f"Invalid area_key: {area_key}")
            area = PREDEFINED_AREAS[area_key]

        result = IngestionResult(
            area_name=area.name,
            shops_found=0,
            shops_created=0,
            shops_updated=0,
            reviews_created=0,
            errors=[],
        )

        try:
            # キーワードごとに検索
            all_places = {}  # place_idでユニーク化

            for keyword in area.keywords:
                query = f"{area.name} {keyword}"
                logger.info(f"Searching: {query}")

                search_result = await self.places_client.text_search(
                    query=query,
                    latitude=area.latitude,
                    longitude=area.longitude,
                    radius=area.radius,
                    max_results=20,
                )

                places = search_result.get("places", [])
                for place in places:
                    place_id = place.get("id")
                    if place_id and place_id not in all_places:
                        all_places[place_id] = place

                # レート制限対策
                await asyncio.sleep(0.5)

            result.shops_found = len(all_places)
            logger.info(f"Found {result.shops_found} unique shops in {area.name}")

            # 各店舗の詳細とレビューを取得・保存
            for place_id, place in all_places.items():
                try:
                    shop_result = await self._process_place(
                        place_id=place_id,
                        place_data=place,
                        fetch_reviews=fetch_reviews,
                    )

                    if shop_result["created"]:
                        result.shops_created += 1
                    else:
                        result.shops_updated += 1

                    result.reviews_created += shop_result["reviews_created"]

                except Exception as e:
                    error_msg = f"Error processing {place_id}: {str(e)}"
                    logger.error(error_msg)
                    result.errors.append(error_msg)

                # レート制限対策
                await asyncio.sleep(0.3)

        except Exception as e:
            error_msg = f"Area ingestion error: {str(e)}"
            logger.error(error_msg)
            result.errors.append(error_msg)

        return result

    async def _process_place(
        self,
        place_id: str,
        place_data: dict,
        fetch_reviews: bool = True,
    ) -> dict:
        """
        単一店舗のデータを処理

        Returns:
            dict: {"created": bool, "reviews_created": int}
        """
        result = {"created": False, "reviews_created": 0}

        # 既存店舗チェック
        existing_shop = self.shop_service.get_by_place_id(place_id)

        # 詳細情報を取得（レビュー含む）
        if fetch_reviews:
            try:
                detail = await self.places_client.get_place_details(place_id)
                place_data = detail  # 詳細情報で上書き
            except Exception as e:
                logger.warning(f"Could not fetch details for {place_id}: {e}")

        # 店舗データを変換
        shop_data_dict = self.places_client.parse_place_to_shop_data(place_data)
        shop_create = ShopCreate(**shop_data_dict)

        # 店舗をUpsert
        if existing_shop:
            shop = self.shop_service.upsert(shop_create)
            result["created"] = False
        else:
            shop = self.shop_service.create(shop_create)
            result["created"] = True

        # レビューを保存
        if fetch_reviews:
            reviews_data = self.places_client.parse_reviews(place_data)
            if reviews_data:
                created_reviews = self.review_service.bulk_create(
                    shop_id=shop.id,
                    reviews_data=reviews_data,
                )
                result["reviews_created"] = len(created_reviews)

        return result

    async def ingest_multiple_areas(
        self,
        area_keys: list[str],
        fetch_reviews: bool = True,
    ) -> list[IngestionResult]:
        """複数エリアのデータを取込"""
        results = []

        for area_key in area_keys:
            logger.info(f"Starting ingestion for area: {area_key}")
            result = await self.ingest_area(
                area_key=area_key,
                fetch_reviews=fetch_reviews,
            )
            results.append(result)
            logger.info(
                f"Completed {area_key}: {result.shops_created} created, "
                f"{result.shops_updated} updated, {result.reviews_created} reviews"
            )

            # エリア間のスリープ
            await asyncio.sleep(1.0)

        return results

    def get_available_areas(self) -> dict[str, dict]:
        """利用可能なエリア一覧を取得"""
        return {
            key: {
                "name": area.name,
                "latitude": area.latitude,
                "longitude": area.longitude,
                "radius": area.radius,
            }
            for key, area in PREDEFINED_AREAS.items()
        }
