"""Initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create shops table
    op.create_table(
        "shops",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("place_id", sa.String(255), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("formatted_address", sa.Text),
        sa.Column(
            "location",
            geoalchemy2.Geography(geometry_type="POINT", srid=4326),
            nullable=False,
        ),
        sa.Column("rating", sa.Float),
        sa.Column("user_ratings_total", sa.Integer),
        sa.Column("price_level", sa.Integer),
        sa.Column("business_status", sa.String(50)),
        sa.Column("opening_hours", postgresql.JSONB),
        sa.Column("phone_number", sa.String(50)),
        sa.Column("website", sa.String(500)),
        sa.Column("raw_data", postgresql.JSONB),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("last_fetched_at", sa.DateTime),
    )
    op.create_index("idx_shops_place_id", "shops", ["place_id"])
    # Note: GeoAlchemy2 automatically creates a spatial index for Geography columns

    # Create reviews table
    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "shop_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("shops.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("author_name", sa.String(255)),
        sa.Column("author_url", sa.Text),
        sa.Column("profile_photo_url", sa.Text),
        sa.Column("rating", sa.Integer),
        sa.Column("text", sa.Text),
        sa.Column("language", sa.String(10)),
        sa.Column("relative_time_description", sa.String(100)),
        sa.Column("time", sa.BigInteger),
        sa.Column("embedding", postgresql.ARRAY(sa.Float, dimensions=1)),
        sa.Column("raw_data", postgresql.JSONB),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("idx_reviews_shop_id", "reviews", ["shop_id"])

    # Create shop_ai_analytics table
    op.create_table(
        "shop_ai_analytics",
        sa.Column(
            "shop_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("shops.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("score_operation", sa.Integer),
        sa.Column("score_accuracy", sa.Integer),
        sa.Column("score_hygiene", sa.Integer),
        sa.Column("score_sincerity", sa.Integer),
        sa.Column("score_safety", sa.Integer),
        sa.Column("variance_score", sa.Float),
        sa.Column("sakura_risk", sa.Integer),
        sa.Column("risk_level", sa.String(20)),
        sa.Column("risk_summary", sa.Text),
        sa.Column("positive_points", postgresql.ARRAY(sa.Text)),
        sa.Column("negative_points", postgresql.ARRAY(sa.Text)),
        sa.Column("analyzed_review_count", sa.Integer),
        sa.Column("analysis_version", sa.String(20)),
        sa.Column("last_analyzed_at", sa.DateTime, server_default=sa.func.now()),
        sa.CheckConstraint("score_operation BETWEEN 0 AND 10", name="check_score_operation"),
        sa.CheckConstraint("score_accuracy BETWEEN 0 AND 10", name="check_score_accuracy"),
        sa.CheckConstraint("score_hygiene BETWEEN 0 AND 10", name="check_score_hygiene"),
        sa.CheckConstraint("score_sincerity BETWEEN 0 AND 10", name="check_score_sincerity"),
        sa.CheckConstraint("score_safety BETWEEN 0 AND 10", name="check_score_safety"),
        sa.CheckConstraint("sakura_risk BETWEEN 0 AND 100", name="check_sakura_risk"),
    )


def downgrade() -> None:
    op.drop_table("shop_ai_analytics")
    op.drop_table("reviews")
    op.drop_table("shops")
