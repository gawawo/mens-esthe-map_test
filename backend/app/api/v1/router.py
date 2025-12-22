from fastapi import APIRouter

from app.api.v1 import analytics, ingestion, reviews, search, shops

api_router = APIRouter()

api_router.include_router(shops.router, prefix="/shops", tags=["shops"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(ingestion.router, prefix="/ingestion", tags=["ingestion"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
