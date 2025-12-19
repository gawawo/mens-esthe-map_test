from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db
from app.models.analytics import ShopAIAnalytics
from app.models.shop import Shop
from app.schemas.analytics import AnalyticsResponse

router = APIRouter()


class AnalyzeRequest(BaseModel):
    """解析リクエスト"""
    shop_ids: Optional[list[str]] = None  # 指定した店舗のみ解析
    limit: int = 20  # 未解析店舗の最大処理数
    force: bool = False  # 既存の解析結果を上書きするか


class AnalyzeResponse(BaseModel):
    """解析レスポンス"""
    status: str
    message: str
    total_shops: int = 0
    analyzed: int = 0
    skipped: int = 0
    failed: int = 0


@router.get("/shop/{shop_id}", response_model=AnalyticsResponse)
def get_shop_analytics(
    shop_id: UUID,
    db: Session = Depends(get_db),
):
    """店舗のAI解析結果を取得"""
    analytics = (
        db.query(ShopAIAnalytics)
        .filter(ShopAIAnalytics.shop_id == shop_id)
        .first()
    )

    if not analytics:
        raise HTTPException(status_code=404, detail="Analytics not found for this shop")

    return analytics


@router.get("/risk-summary")
def get_risk_summary(
    db: Session = Depends(get_db),
    risk_level: Optional[str] = Query(None, description="safe/gamble/mine/fake"),
):
    """リスクレベル別の店舗数サマリーを取得"""
    from sqlalchemy import func

    query = (
        db.query(
            ShopAIAnalytics.risk_level,
            func.count(ShopAIAnalytics.shop_id).label("count"),
        )
        .group_by(ShopAIAnalytics.risk_level)
    )

    if risk_level:
        query = query.filter(ShopAIAnalytics.risk_level == risk_level)

    results = query.all()

    return {
        "summary": [
            {"risk_level": r.risk_level, "count": r.count}
            for r in results
        ],
        "total": sum(r.count for r in results),
    }


@router.get("/unanalyzed")
def get_unanalyzed_shops(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
):
    """未解析の店舗一覧を取得"""
    # AI解析結果がない店舗を取得
    shops = (
        db.query(Shop)
        .outerjoin(ShopAIAnalytics)
        .filter(ShopAIAnalytics.shop_id.is_(None))
        .limit(limit)
        .all()
    )

    return {
        "count": len(shops),
        "shops": [
            {
                "id": str(shop.id),
                "name": shop.name,
                "place_id": shop.place_id,
            }
            for shop in shops
        ],
    }


@router.post("/analyze/shop/{shop_id}", response_model=AnalyticsResponse)
async def analyze_single_shop(
    shop_id: UUID,
    force: bool = Query(False, description="既存の解析結果を上書きするか"),
    db: Session = Depends(get_db),
):
    """
    単一店舗のレビューを解析

    - shop_id: 店舗ID
    - force: 既存の解析結果がある場合に上書きするか
    """
    from app.ai.analyzer import ReviewAnalyzer

    # 店舗存在チェック
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    # 解析実行
    analyzer = ReviewAnalyzer(db)
    try:
        analytics = await analyzer.analyze_shop(shop_id, force=force)

        if analytics is None:
            raise HTTPException(status_code=500, detail="Analysis failed")

        return analytics

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@router.post("/analyze/batch", response_model=AnalyzeResponse)
async def analyze_batch(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
):
    """
    バッチ解析を実行

    - shop_ids: 指定した店舗のみ解析（省略時は未解析店舗を対象）
    - limit: 処理する最大店舗数
    - force: 既存の解析結果を上書きするか
    """
    from app.ai.analyzer import ReviewAnalyzer

    analyzer = ReviewAnalyzer(db)

    try:
        if request.shop_ids:
            # 指定した店舗を解析
            uuids = [UUID(sid) for sid in request.shop_ids]
            results = await analyzer.analyze_multiple_shops(uuids, force=request.force)
        else:
            # 未解析店舗を解析
            unanalyzed_shops = analyzer.get_unanalyzed_shops(limit=request.limit)
            shop_ids = [shop.id for shop in unanalyzed_shops]
            results = await analyzer.analyze_multiple_shops(shop_ids, force=request.force)

        return AnalyzeResponse(
            status="completed",
            message=f"Analyzed {results['success']} shops",
            total_shops=results["total"],
            analyzed=results["success"],
            skipped=results["skipped"],
            failed=results["failed"],
        )

    except Exception as e:
        return AnalyzeResponse(
            status="error",
            message=f"Batch analysis failed: {str(e)}",
        )


@router.post("/analyze/background")
async def analyze_background(
    background_tasks: BackgroundTasks,
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
):
    """
    バックグラウンドで解析を実行

    APIはすぐにレスポンスを返し、解析はバックグラウンドで実行される
    """
    from app.tasks.analysis_task import run_analysis_batch

    # バックグラウンドタスクを追加
    if request.shop_ids:
        # 特定店舗の解析はここでは未対応（バッチのみ）
        background_tasks.add_task(
            run_analysis_batch,
            task_type="unanalyzed",
            limit=request.limit,
        )
    else:
        background_tasks.add_task(
            run_analysis_batch,
            task_type="unanalyzed",
            limit=request.limit,
        )

    return {
        "status": "accepted",
        "message": f"Analysis task queued (limit={request.limit})",
    }


@router.get("/scheduler/status")
def get_scheduler_status():
    """スケジューラの状態を取得"""
    from app.tasks.scheduler import get_scheduler

    scheduler = get_scheduler()
    return scheduler.get_status()


@router.post("/scheduler/run/{job_name}")
async def run_scheduler_job(job_name: str):
    """スケジューラのジョブを即座に実行"""
    from app.tasks.scheduler import get_scheduler

    scheduler = get_scheduler()

    if job_name not in scheduler.jobs:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_name}")

    try:
        result = await scheduler.run_job(job_name)
        return {
            "status": "completed",
            "job_name": job_name,
            "result": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job execution failed: {str(e)}")
