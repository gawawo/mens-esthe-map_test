from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class LocationSchema(BaseModel):
    lat: float = Field(..., description="緯度")
    lng: float = Field(..., description="経度")


class ShopBase(BaseModel):
    place_id: str
    name: str
    formatted_address: Optional[str] = None
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    price_level: Optional[int] = None
    business_status: Optional[str] = None
    opening_hours: Optional[dict] = None
    phone_number: Optional[str] = None
    website: Optional[str] = None


class ShopCreate(ShopBase):
    latitude: float
    longitude: float
    raw_data: Optional[dict] = None


class ShopUpdate(BaseModel):
    name: Optional[str] = None
    formatted_address: Optional[str] = None
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    price_level: Optional[int] = None
    business_status: Optional[str] = None
    opening_hours: Optional[dict] = None
    phone_number: Optional[str] = None
    website: Optional[str] = None
    raw_data: Optional[dict] = None


class AnalyticsSummary(BaseModel):
    """店舗一覧用の解析結果サマリー"""
    risk_level: Optional[str] = None
    score_operation: Optional[int] = None
    score_accuracy: Optional[int] = None
    score_hygiene: Optional[int] = None
    score_sincerity: Optional[int] = None
    score_safety: Optional[int] = None
    variance_score: Optional[float] = None
    sakura_risk: Optional[int] = None
    # AI判定理由
    risk_summary: Optional[str] = None
    positive_points: Optional[list[str]] = None
    negative_points: Optional[list[str]] = None

    class Config:
        from_attributes = True


class ShopResponse(ShopBase):
    id: UUID
    location: LocationSchema
    created_at: datetime
    updated_at: datetime
    last_fetched_at: Optional[datetime] = None
    analytics: Optional[AnalyticsSummary] = None

    class Config:
        from_attributes = True


class ShopListResponse(BaseModel):
    shops: list[ShopResponse]
    total: int
    page: int
    per_page: int
