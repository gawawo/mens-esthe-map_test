import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config import settings

# ロギング設定
logging.basicConfig(
    level=logging.INFO if settings.debug else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    # 起動時
    logger.info("Starting Men's Esthe Map API...")

    # スケジューラの初期化と起動（本番環境のみ）
    if settings.env == "production":
        from app.tasks.scheduler import get_scheduler, setup_default_jobs

        scheduler = get_scheduler()
        setup_default_jobs(scheduler)
        scheduler.start()
        logger.info("Scheduler started")

    yield

    # 終了時
    logger.info("Shutting down Men's Esthe Map API...")

    if settings.env == "production":
        from app.tasks.scheduler import get_scheduler

        scheduler = get_scheduler()
        scheduler.stop()
        logger.info("Scheduler stopped")


app = FastAPI(
    title="Men's Esthe Map API",
    description="リスク回避型メンズエステ店検索API",
    version="0.1.0",
    debug=settings.debug,
    lifespan=lifespan,
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーター登録
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {
        "status": "healthy",
        "env": settings.env,
        "version": "0.1.0",
    }


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "name": "Men's Esthe Map API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }
