from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AnalyticsBase(BaseModel):
    # リスク回避5角形スコア
    score_operation: int = Field(..., ge=0, le=10, description="運営のまともさ")
    score_accuracy: int = Field(..., ge=0, le=10, description="情報の正確性")
    score_hygiene: int = Field(..., ge=0, le=10, description="衛生・環境")
    score_sincerity: int = Field(..., ge=0, le=10, description="施術の誠実さ")
    score_safety: int = Field(..., ge=0, le=10, description="心理的安全性")

    # 裏パラメータ
    variance_score: float = Field(..., ge=0, le=100, description="ギャンブル度")
    sakura_risk: int = Field(..., ge=0, le=100, description="サクラ汚染度")

    # 総合判定
    risk_level: str = Field(..., description="safe/gamble/mine/fake")

    # テキスト情報
    risk_summary: Optional[str] = None
    positive_points: Optional[list[str]] = None
    negative_points: Optional[list[str]] = None


class AnalyticsCreate(AnalyticsBase):
    shop_id: UUID
    analyzed_review_count: int
    analysis_version: str = "1.0"


class AnalyticsResponse(AnalyticsBase):
    shop_id: UUID
    analyzed_review_count: Optional[int] = None
    analysis_version: Optional[str] = None
    last_analyzed_at: datetime

    class Config:
        from_attributes = True


class AnalyticsWithShopResponse(AnalyticsResponse):
    """解析結果と店舗情報を含むレスポンス"""

    shop_name: str
    shop_place_id: str
