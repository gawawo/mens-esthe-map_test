import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shop_id = Column(UUID(as_uuid=True), ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)

    # レビュー著者情報
    author_name = Column(String(255))
    author_url = Column(Text)
    profile_photo_url = Column(Text)

    # レビュー内容
    rating = Column(Integer)  # 1-5
    text = Column(Text)
    text_ja = Column(Text)  # 日本語翻訳テキスト
    language = Column(String(10))
    relative_time_description = Column(String(100))
    time = Column(BigInteger)  # Unix timestamp

    # ベクトル埋め込み（RAG用）
    embedding = Column(Vector(768))

    # メタデータ
    raw_data = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    shop = relationship("Shop", back_populates="reviews")

    __table_args__ = (
        Index("idx_reviews_shop_id", shop_id),
        Index(
            "idx_reviews_embedding",
            embedding,
            postgresql_using="ivfflat",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    def __repr__(self):
        return f"<Review(id={self.id}, shop_id={self.shop_id}, rating={self.rating})>"
