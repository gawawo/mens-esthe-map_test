import uuid
from datetime import datetime

from geoalchemy2 import Geography
from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class Shop(Base):
    __tablename__ = "shops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    place_id = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    formatted_address = Column(Text)

    # PostGIS地理データ
    location = Column(Geography(geometry_type="POINT", srid=4326), nullable=False)

    # Google Places基本情報
    rating = Column(Float)
    user_ratings_total = Column(Integer)
    price_level = Column(Integer)

    # 営業情報
    business_status = Column(String(50))
    opening_hours = Column(JSONB)
    phone_number = Column(String(50))
    website = Column(String(500))

    # メタデータ
    raw_data = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_fetched_at = Column(DateTime)

    # Relationships
    reviews = relationship("Review", back_populates="shop", cascade="all, delete-orphan")
    analytics = relationship(
        "ShopAIAnalytics", back_populates="shop", uselist=False, cascade="all, delete-orphan"
    )

    # Note: GeoAlchemy2 automatically creates a spatial index for Geography columns

    def __repr__(self):
        return f"<Shop(id={self.id}, name={self.name})>"
