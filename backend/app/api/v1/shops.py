from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.review import ReviewListResponse
from app.schemas.shop import ShopListResponse, ShopResponse
from app.services.ingestion import PREDEFINED_AREAS
from app.services.review_service import ReviewService
from app.services.shop_service import ShopService

router = APIRouter()


@router.get("", response_model=ShopListResponse)
def get_shops(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=500),
    risk_level: Optional[str] = Query(None, description="safe/gamble/mine/fake"),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
):
    """店舗一覧を取得"""
    skip = (page - 1) * per_page
    shop_service = ShopService(db)
    shops, total = shop_service.get_all(
        skip=skip,
        limit=per_page,
        risk_level=risk_level,
        min_rating=min_rating,
    )

    return ShopListResponse(
        shops=[ShopService.shop_to_response(shop) for shop in shops],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/nearby", response_model=list[ShopResponse])
def get_nearby_shops(
    db: Session = Depends(get_db),
    lat: float = Query(..., description="緯度"),
    lng: float = Query(..., description="経度"),
    radius: float = Query(1000.0, description="検索半径（メートル）"),
    limit: int = Query(50, ge=1, le=100),
    risk_level: Optional[str] = Query(None, description="safe/gamble/mine/fake"),
):
    """指定座標の近隣店舗を取得"""
    shop_service = ShopService(db)
    shops = shop_service.get_nearby(
        latitude=lat,
        longitude=lng,
        radius_meters=radius,
        limit=limit,
        risk_level=risk_level,
    )

    return [ShopService.shop_to_response(shop) for shop in shops]


@router.get("/ranking")
def get_shop_ranking(
    db: Session = Depends(get_db),
    area: Optional[str] = Query(
        None, description="エリアキー: shinjuku/shibuya/ikebukuro/ueno/akihabara"
    ),
    lat: Optional[float] = Query(None, description="緯度（areaが指定されない場合必須）"),
    lng: Optional[float] = Query(None, description="経度（areaが指定されない場合必須）"),
    radius: float = Query(2000.0, description="検索半径（メートル）"),
    limit: int = Query(20, ge=1, le=50),
    sort_by: str = Query(
        "avg_score", description="ソート基準: avg_score/score_safety/score_accuracy"
    ),
):
    """
    エリア内店舗の評価ランキングを取得

    - area: 事前定義エリア（指定するとlat/lngは不要）
    - sort_by: avg_score=総合スコア, score_safety=安全性, score_accuracy=正確性
    """
    # エリアキーから座標を取得
    if area:
        area_def = PREDEFINED_AREAS.get(area)
        if area_def:
            lat = area_def.latitude
            lng = area_def.longitude
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid area key: {area}. Valid keys: {list(PREDEFINED_AREAS.keys())}",
            )

    if lat is None or lng is None:
        raise HTTPException(status_code=400, detail="Either area or lat/lng must be provided")

    shop_service = ShopService(db)
    results = shop_service.get_nearby_with_ranking(
        latitude=lat,
        longitude=lng,
        radius_meters=radius,
        limit=limit,
        sort_by=sort_by,
    )

    return {
        "area": area,
        "total": len(results),
        "ranking": [
            {
                "rank": i + 1,
                "shop": ShopService.shop_to_response(shop),
                "avg_score": round(avg_score, 1),
            }
            for i, (shop, avg_score) in enumerate(results)
        ],
    }


@router.get("/{shop_id}", response_model=ShopResponse)
def get_shop(
    shop_id: UUID,
    db: Session = Depends(get_db),
):
    """店舗詳細を取得"""
    shop_service = ShopService(db)
    shop = shop_service.get_by_id(shop_id)

    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    return ShopService.shop_to_response(shop)


@router.get("/{shop_id}/reviews", response_model=ReviewListResponse)
def get_shop_reviews(
    shop_id: UUID,
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    language: str | None = Query(None, description="言語コード（ja/en/null=全て）"),
):
    """店舗のレビュー一覧を取得（全言語、text_jaに日本語翻訳を含む）"""
    shop_service = ShopService(db)
    shop = shop_service.get_by_id(shop_id)

    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    review_service = ReviewService(db)
    reviews = review_service.get_by_shop_id(shop_id, limit=limit, language=language)

    return ReviewListResponse(
        reviews=reviews,
        total=len(reviews),
    )


@router.delete("/{shop_id}")
def delete_shop(
    shop_id: UUID,
    db: Session = Depends(get_db),
):
    """店舗を削除"""
    shop_service = ShopService(db)
    deleted = shop_service.delete(shop_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Shop not found")

    return {"message": "Shop deleted successfully"}
