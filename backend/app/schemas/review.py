from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ReviewBase(BaseModel):
    author_name: Optional[str] = None
    author_url: Optional[str] = None
    profile_photo_url: Optional[str] = None
    rating: Optional[int] = None
    text: Optional[str] = None
    text_ja: Optional[str] = None  # 日本語翻訳テキスト
    language: Optional[str] = None
    relative_time_description: Optional[str] = None
    time: Optional[int] = None  # Unix timestamp


class ReviewCreate(ReviewBase):
    shop_id: UUID
    raw_data: Optional[dict] = None


class ReviewResponse(ReviewBase):
    id: UUID
    shop_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewListResponse(BaseModel):
    reviews: list[ReviewResponse]
    total: int
