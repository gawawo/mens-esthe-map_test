from datetime import datetime
from typing import Optional
from uuid import UUID

from geoalchemy2.functions import ST_DWithin, ST_MakePoint
from geoalchemy2.shape import to_shape
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.analytics import ShopAIAnalytics
from app.models.shop import Shop
from app.schemas.shop import LocationSchema, ShopCreate, ShopResponse, ShopUpdate


class ShopService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, shop_id: UUID) -> Optional[Shop]:
        """IDで店舗を取得"""
        return (
            self.db.query(Shop)
            .options(joinedload(Shop.analytics))
            .filter(Shop.id == shop_id)
            .first()
        )

    def get_by_place_id(self, place_id: str) -> Optional[Shop]:
        """Google Place IDで店舗を取得"""
        return self.db.query(Shop).filter(Shop.place_id == place_id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        risk_level: Optional[str] = None,
        min_rating: Optional[float] = None,
    ) -> tuple[list[Shop], int]:
        """店舗一覧を取得"""
        query = self.db.query(Shop).options(joinedload(Shop.analytics))

        # フィルター適用
        if risk_level:
            query = query.join(Shop.analytics).filter(ShopAIAnalytics.risk_level == risk_level)

        if min_rating is not None:
            query = query.filter(Shop.rating >= min_rating)

        total = query.count()
        shops = query.offset(skip).limit(limit).all()

        return shops, total

    def get_nearby(
        self,
        latitude: float,
        longitude: float,
        radius_meters: float = 1000.0,
        limit: int = 50,
        risk_level: Optional[str] = None,
    ) -> list[Shop]:
        """指定座標の近隣店舗を取得"""
        query = (
            self.db.query(Shop)
            .options(joinedload(Shop.analytics))
            .filter(
                ST_DWithin(
                    Shop.location,
                    func.ST_GeogFromText(f"POINT({longitude} {latitude})"),
                    radius_meters,
                )
            )
        )

        if risk_level:
            query = query.join(Shop.analytics).filter(ShopAIAnalytics.risk_level == risk_level)

        return query.limit(limit).all()

    def get_nearby_with_ranking(
        self,
        latitude: float,
        longitude: float,
        radius_meters: float = 2000.0,
        limit: int = 20,
        sort_by: str = "avg_score",
    ) -> list[tuple[Shop, float]]:
        """
        近隣店舗をスコア順で取得（ランキング用）

        Returns:
            List of (Shop, avg_score) tuples
        """
        # 平均スコア計算
        avg_score = (
            ShopAIAnalytics.score_operation
            + ShopAIAnalytics.score_accuracy
            + ShopAIAnalytics.score_hygiene
            + ShopAIAnalytics.score_sincerity
            + ShopAIAnalytics.score_safety
        ) / 5.0

        query = (
            self.db.query(Shop, avg_score.label("avg_score"))
            .join(ShopAIAnalytics, Shop.id == ShopAIAnalytics.shop_id)
            .filter(
                ST_DWithin(
                    Shop.location,
                    func.ST_GeogFromText(f"POINT({longitude} {latitude})"),
                    radius_meters,
                )
            )
        )

        # ソート条件
        if sort_by == "score_safety":
            query = query.order_by(ShopAIAnalytics.score_safety.desc())
        elif sort_by == "score_accuracy":
            query = query.order_by(ShopAIAnalytics.score_accuracy.desc())
        else:
            query = query.order_by(avg_score.desc())

        return query.limit(limit).all()

    def create(self, shop_data: ShopCreate) -> Shop:
        """新規店舗を作成"""
        # PostGIS POINTを作成
        location = func.ST_SetSRID(ST_MakePoint(shop_data.longitude, shop_data.latitude), 4326)

        shop = Shop(
            place_id=shop_data.place_id,
            name=shop_data.name,
            formatted_address=shop_data.formatted_address,
            location=location,
            rating=shop_data.rating,
            user_ratings_total=shop_data.user_ratings_total,
            price_level=shop_data.price_level,
            business_status=shop_data.business_status,
            opening_hours=shop_data.opening_hours,
            phone_number=shop_data.phone_number,
            website=shop_data.website,
            raw_data=shop_data.raw_data,
            last_fetched_at=datetime.utcnow(),
        )

        self.db.add(shop)
        self.db.commit()
        self.db.refresh(shop)
        return shop

    def upsert(self, shop_data: ShopCreate) -> Shop:
        """店舗をUpsert（存在すれば更新、なければ作成）"""
        existing = self.get_by_place_id(shop_data.place_id)

        if existing:
            return self.update(
                existing.id,
                ShopUpdate(
                    name=shop_data.name,
                    formatted_address=shop_data.formatted_address,
                    rating=shop_data.rating,
                    user_ratings_total=shop_data.user_ratings_total,
                    price_level=shop_data.price_level,
                    business_status=shop_data.business_status,
                    opening_hours=shop_data.opening_hours,
                    phone_number=shop_data.phone_number,
                    website=shop_data.website,
                    raw_data=shop_data.raw_data,
                ),
            )
        else:
            return self.create(shop_data)

    def update(self, shop_id: UUID, shop_update: ShopUpdate) -> Optional[Shop]:
        """店舗情報を更新"""
        shop = self.get_by_id(shop_id)
        if not shop:
            return None

        update_data = shop_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(shop, field, value)

        shop.updated_at = datetime.utcnow()
        shop.last_fetched_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(shop)
        return shop

    def delete(self, shop_id: UUID) -> bool:
        """店舗を削除"""
        shop = self.get_by_id(shop_id)
        if not shop:
            return False

        self.db.delete(shop)
        self.db.commit()
        return True

    @staticmethod
    def shop_to_response(shop: Shop) -> ShopResponse:
        """ShopモデルをShopResponseに変換"""
        # PostGIS Geographyから緯度・経度を抽出
        if shop.location:
            # GeoAlchemy2のto_shapeを使用
            point = to_shape(shop.location)
            location = LocationSchema(lat=point.y, lng=point.x)
        else:
            location = LocationSchema(lat=0, lng=0)

        return ShopResponse(
            id=shop.id,
            place_id=shop.place_id,
            name=shop.name,
            formatted_address=shop.formatted_address,
            location=location,
            rating=shop.rating,
            user_ratings_total=shop.user_ratings_total,
            price_level=shop.price_level,
            business_status=shop.business_status,
            opening_hours=shop.opening_hours,
            phone_number=shop.phone_number,
            website=shop.website,
            created_at=shop.created_at,
            updated_at=shop.updated_at,
            last_fetched_at=shop.last_fetched_at,
            analytics=shop.analytics,
        )
