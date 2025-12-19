from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.models.base import Base


class ShopAIAnalytics(Base):
    __tablename__ = "shop_ai_analytics"

    shop_id = Column(UUID(as_uuid=True), ForeignKey("shops.id", ondelete="CASCADE"), primary_key=True)

    # リスク回避5角形スコア（10点満点：高いほど安全）
    score_operation = Column(Integer)   # 運営のまともさ
    score_accuracy = Column(Integer)    # 情報の正確性
    score_hygiene = Column(Integer)     # 衛生・環境
    score_sincerity = Column(Integer)   # 施術の誠実さ
    score_safety = Column(Integer)      # 心理的安全性

    # 裏パラメータ
    variance_score = Column(Float)      # ギャンブル度（0-100）
    sakura_risk = Column(Integer)       # サクラ汚染度（0-100%）

    # 総合判定
    risk_level = Column(String(20))     # safe/gamble/mine/fake

    # テキスト情報
    risk_summary = Column(Text)
    positive_points = Column(ARRAY(Text))
    negative_points = Column(ARRAY(Text))

    # 解析メタデータ
    analyzed_review_count = Column(Integer)
    analysis_version = Column(String(20))
    last_analyzed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    shop = relationship("Shop", back_populates="analytics")

    __table_args__ = (
        CheckConstraint("score_operation BETWEEN 0 AND 10", name="check_score_operation"),
        CheckConstraint("score_accuracy BETWEEN 0 AND 10", name="check_score_accuracy"),
        CheckConstraint("score_hygiene BETWEEN 0 AND 10", name="check_score_hygiene"),
        CheckConstraint("score_sincerity BETWEEN 0 AND 10", name="check_score_sincerity"),
        CheckConstraint("score_safety BETWEEN 0 AND 10", name="check_score_safety"),
        CheckConstraint("sakura_risk BETWEEN 0 AND 100", name="check_sakura_risk"),
    )

    def __repr__(self):
        return f"<ShopAIAnalytics(shop_id={self.shop_id}, risk_level={self.risk_level})>"
