import asyncio
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.shop import Shop
from app.services.apify_client import ApifyReviewsService
from app.services.ingestion import PREDEFINED_AREAS, AreaDefinition, IngestionService
from app.services.places_api import PlacesAPIClient
from app.services.review_service import ReviewService
from app.services.shop_service import ShopService

logger = logging.getLogger(__name__)

router = APIRouter()


class IngestionRequest(BaseModel):
    area_key: Optional[str] = None
    custom_area: Optional[dict] = None
    fetch_reviews: bool = True


class IngestionResponse(BaseModel):
    area_name: str
    shops_found: int
    shops_created: int
    shops_updated: int
    reviews_created: int
    errors: list[str]


@router.get("/areas")
def get_available_areas():
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


@router.post("/run", response_model=IngestionResponse)
async def run_ingestion(
    request: IngestionRequest,
    db: Session = Depends(get_db),
):
    """
    指定エリアのデータ取込を実行

    - area_key: 事前定義エリア（shinjuku, shibuya, ikebukuro, ueno, akihabara）
    - custom_area: カスタムエリア定義 {"name": "...", "latitude": ..., "longitude": ..., "radius": ...}
    """
    ingestion_service = IngestionService(db)

    area = None
    if request.custom_area:
        try:
            area = AreaDefinition(
                name=request.custom_area.get("name", "Custom"),
                latitude=request.custom_area["latitude"],
                longitude=request.custom_area["longitude"],
                radius=request.custom_area.get("radius", 1000.0),
                keywords=request.custom_area.get("keywords"),
            )
        except KeyError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required field in custom_area: {e}",
            )

    if area is None and request.area_key is None:
        raise HTTPException(
            status_code=400,
            detail="Either area_key or custom_area must be provided",
        )

    result = await ingestion_service.ingest_area(
        area_key=request.area_key,
        area=area,
        fetch_reviews=request.fetch_reviews,
    )

    return IngestionResponse(
        area_name=result.area_name,
        shops_found=result.shops_found,
        shops_created=result.shops_created,
        shops_updated=result.shops_updated,
        reviews_created=result.reviews_created,
        errors=result.errors,
    )


@router.post("/run-multiple")
async def run_multiple_ingestion(
    area_keys: list[str] = Query(..., description="取込するエリアキーのリスト"),
    fetch_reviews: bool = Query(True),
    db: Session = Depends(get_db),
):
    """複数エリアのデータ取込を実行"""
    # エリアキーの検証
    invalid_keys = [k for k in area_keys if k not in PREDEFINED_AREAS]
    if invalid_keys:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid area keys: {invalid_keys}",
        )

    ingestion_service = IngestionService(db)
    results = await ingestion_service.ingest_multiple_areas(
        area_keys=area_keys,
        fetch_reviews=fetch_reviews,
    )

    return {
        "results": [
            {
                "area_name": r.area_name,
                "shops_found": r.shops_found,
                "shops_created": r.shops_created,
                "shops_updated": r.shops_updated,
                "reviews_created": r.reviews_created,
                "errors": r.errors,
            }
            for r in results
        ],
        "total_shops_created": sum(r.shops_created for r in results),
        "total_reviews_created": sum(r.reviews_created for r in results),
    }


@router.post("/refresh-reviews")
async def refresh_reviews(
    limit: int = Query(100, description="処理する店舗数の上限"),
    db: Session = Depends(get_db),
):
    """
    既存店舗のレビューを日本語で再取得

    Google Places APIから日本語でレビューを再取得し、
    既存の英語レビューを置き換えます。
    """
    places_client = PlacesAPIClient()
    shop_service = ShopService(db)
    review_service = ReviewService(db)

    # 全店舗を取得
    shops, total = shop_service.get_all(limit=limit)

    result = {
        "total_shops": len(shops),
        "processed": 0,
        "reviews_deleted": 0,
        "reviews_created": 0,
        "errors": [],
    }

    for shop in shops:
        try:
            # 日本語でレビューを取得
            detail = await places_client.get_place_details(
                place_id=shop.place_id, language_code="ja"
            )

            # 既存レビューを削除
            deleted_count = review_service.delete_by_shop_id(shop.id)
            result["reviews_deleted"] += deleted_count

            # 新しいレビューを保存
            reviews_data = places_client.parse_reviews(detail)
            if reviews_data:
                created_reviews = review_service.bulk_create(
                    shop_id=shop.id,
                    reviews_data=reviews_data,
                )
                result["reviews_created"] += len(created_reviews)

            result["processed"] += 1

            # レート制限対策
            await asyncio.sleep(0.5)

        except Exception as e:
            result["errors"].append(f"Shop {shop.name}: {str(e)}")

    return result


# ============================================
# Apify Google Reviews Scraper Endpoints
# ============================================


@router.post("/fetch-all-reviews/{shop_id}")
async def fetch_all_reviews(
    shop_id: UUID,
    max_reviews: int = Query(100, ge=10, le=500, description="取得する最大レビュー数"),
    db: Session = Depends(get_db),
):
    """
    Apifyを使用して店舗のレビュー全件を取得

    Google Places APIの5件制限を超えて、全レビューを取得します。
    既存のレビューは削除され、新しいレビューに置き換えられます。
    """
    # 店舗取得
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    try:
        # Apifyでレビュー取得
        apify_service = ApifyReviewsService()
        reviews = await apify_service.fetch_reviews_by_place_id(
            place_id=shop.place_id,
            max_reviews=max_reviews,
            language="ja",
        )

        # 既存レビュー削除 & 新規保存
        review_service = ReviewService(db)
        deleted_count = review_service.delete_by_shop_id(shop_id)
        created_reviews = review_service.bulk_create(shop_id, reviews)

        logger.info(
            f"Shop {shop.name}: deleted {deleted_count}, "
            f"fetched {len(reviews)}, created {len(created_reviews)}"
        )

        return {
            "shop_id": str(shop_id),
            "shop_name": shop.name,
            "reviews_deleted": deleted_count,
            "reviews_fetched": len(reviews),
            "reviews_created": len(created_reviews),
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Apify fetch error for shop {shop_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch reviews: {str(e)}")


@router.post("/fetch-all-reviews-batch")
async def fetch_all_reviews_batch(
    shop_ids: Optional[list[UUID]] = Body(None, description="対象店舗ID（省略時は全店舗）"),
    max_reviews: int = Query(100, ge=10, le=500, description="店舗あたりの最大レビュー数"),
    db: Session = Depends(get_db),
):
    """
    複数店舗のレビューを一括取得

    shop_idsを省略すると全店舗が対象になります。
    レート制限のため、店舗間に1秒の間隔を設けます。
    """
    # 対象店舗を取得
    if shop_ids:
        shops = db.query(Shop).filter(Shop.id.in_(shop_ids)).all()
    else:
        shops = db.query(Shop).all()

    if not shops:
        raise HTTPException(status_code=404, detail="No shops found")

    results = []
    total_fetched = 0
    total_created = 0

    for i, shop in enumerate(shops):
        logger.info(f"Processing shop {i+1}/{len(shops)}: {shop.name}")

        try:
            # Apifyでレビュー取得
            apify_service = ApifyReviewsService()
            reviews = await apify_service.fetch_reviews_by_place_id(
                place_id=shop.place_id,
                max_reviews=max_reviews,
                language="ja",
            )

            # 既存レビュー削除 & 新規保存
            review_service = ReviewService(db)
            review_service.delete_by_shop_id(shop.id)
            created_reviews = review_service.bulk_create(shop.id, reviews)

            result = {
                "shop_id": str(shop.id),
                "shop_name": shop.name,
                "reviews_fetched": len(reviews),
                "reviews_created": len(created_reviews),
                "status": "success",
            }
            total_fetched += len(reviews)
            total_created += len(created_reviews)

        except Exception as e:
            logger.error(f"Error fetching reviews for shop {shop.id}: {e}")
            result = {
                "shop_id": str(shop.id),
                "shop_name": shop.name,
                "error": str(e),
                "status": "failed",
            }

        results.append(result)

        # レート制限（最後の店舗以外）
        if i < len(shops) - 1:
            await asyncio.sleep(1)

    return {
        "total_shops": len(shops),
        "successful": sum(1 for r in results if r.get("status") == "success"),
        "failed": sum(1 for r in results if r.get("status") == "failed"),
        "total_reviews_fetched": total_fetched,
        "total_reviews_created": total_created,
        "results": results,
    }
