"""
AI解析バッチタスク
"""

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.ai.analyzer import ReviewAnalyzer
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


@dataclass
class AnalysisTaskResult:
    """解析タスクの結果"""

    started_at: datetime
    completed_at: datetime
    total_shops: int
    analyzed: int
    skipped: int
    failed: int
    errors: list[dict]


class AnalysisTask:
    """解析バッチタスク"""

    def __init__(self, db: Optional[Session] = None):
        self.db = db or SessionLocal()
        self.analyzer = ReviewAnalyzer(self.db)

    async def run_unanalyzed(
        self,
        limit: int = 50,
        force: bool = False,
    ) -> AnalysisTaskResult:
        """
        未解析の店舗を解析

        Args:
            limit: 処理する最大店舗数
            force: 既存の解析結果を上書きするか

        Returns:
            タスク結果
        """
        started_at = datetime.utcnow()
        logger.info(f"Starting analysis task for unanalyzed shops (limit={limit})")

        # 未解析店舗を取得
        unanalyzed_shops = self.analyzer.get_unanalyzed_shops(limit=limit)
        shop_ids = [shop.id for shop in unanalyzed_shops]

        logger.info(f"Found {len(shop_ids)} unanalyzed shops")

        # 解析実行
        results = await self.analyzer.analyze_multiple_shops(shop_ids, force=force)

        completed_at = datetime.utcnow()

        return AnalysisTaskResult(
            started_at=started_at,
            completed_at=completed_at,
            total_shops=results["total"],
            analyzed=results["success"],
            skipped=results["skipped"],
            failed=results["failed"],
            errors=results["errors"],
        )

    async def run_outdated(
        self,
        days_threshold: int = 30,
        limit: int = 50,
    ) -> AnalysisTaskResult:
        """
        解析結果が古い店舗を再解析

        Args:
            days_threshold: 古いとみなす日数
            limit: 処理する最大店舗数

        Returns:
            タスク結果
        """
        started_at = datetime.utcnow()
        logger.info(
            f"Starting analysis task for outdated shops "
            f"(threshold={days_threshold} days, limit={limit})"
        )

        # 古い解析結果を持つ店舗を取得
        outdated_shops = self.analyzer.get_outdated_shops(
            days_threshold=days_threshold,
            limit=limit,
        )
        shop_ids = [shop.id for shop in outdated_shops]

        logger.info(f"Found {len(shop_ids)} outdated shops")

        # 解析実行（強制更新）
        results = await self.analyzer.analyze_multiple_shops(shop_ids, force=True)

        completed_at = datetime.utcnow()

        return AnalysisTaskResult(
            started_at=started_at,
            completed_at=completed_at,
            total_shops=results["total"],
            analyzed=results["success"],
            skipped=results["skipped"],
            failed=results["failed"],
            errors=results["errors"],
        )

    async def run_specific_shops(
        self,
        shop_ids: list[str],
        force: bool = True,
    ) -> AnalysisTaskResult:
        """
        指定した店舗を解析

        Args:
            shop_ids: 店舗IDリスト（文字列）
            force: 既存の解析結果を上書きするか

        Returns:
            タスク結果
        """
        from uuid import UUID

        started_at = datetime.utcnow()
        logger.info(f"Starting analysis task for {len(shop_ids)} specific shops")

        # UUID変換
        uuids = [UUID(sid) for sid in shop_ids]

        # 解析実行
        results = await self.analyzer.analyze_multiple_shops(uuids, force=force)

        completed_at = datetime.utcnow()

        return AnalysisTaskResult(
            started_at=started_at,
            completed_at=completed_at,
            total_shops=results["total"],
            analyzed=results["success"],
            skipped=results["skipped"],
            failed=results["failed"],
            errors=results["errors"],
        )

    def close(self):
        """DBセッションを閉じる"""
        if self.db:
            self.db.close()


async def run_analysis_batch(
    task_type: str = "unanalyzed",
    limit: int = 50,
    **kwargs,
) -> dict:
    """
    解析バッチを実行するヘルパー関数

    Args:
        task_type: タスクタイプ（unanalyzed/outdated）
        limit: 処理する最大店舗数
        **kwargs: 追加パラメータ

    Returns:
        タスク結果の辞書
    """
    task = AnalysisTask()

    try:
        if task_type == "unanalyzed":
            result = await task.run_unanalyzed(limit=limit)
        elif task_type == "outdated":
            days_threshold = kwargs.get("days_threshold", 30)
            result = await task.run_outdated(
                days_threshold=days_threshold,
                limit=limit,
            )
        else:
            raise ValueError(f"Unknown task type: {task_type}")

        return {
            "status": "completed",
            "started_at": result.started_at.isoformat(),
            "completed_at": result.completed_at.isoformat(),
            "duration_seconds": (result.completed_at - result.started_at).total_seconds(),
            "total_shops": result.total_shops,
            "analyzed": result.analyzed,
            "skipped": result.skipped,
            "failed": result.failed,
            "errors": result.errors,
        }

    finally:
        task.close()
