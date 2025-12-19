"""
タスクスケジューラ
定期実行ジョブの管理
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Callable, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class ScheduledJob:
    """スケジュールされたジョブ"""
    name: str
    func: Callable
    interval_minutes: int
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    is_running: bool = False
    run_count: int = 0
    error_count: int = 0
    kwargs: dict = field(default_factory=dict)

    def should_run(self) -> bool:
        """実行すべきかどうかを判定"""
        if self.is_running:
            return False
        if self.next_run is None:
            return True
        return datetime.utcnow() >= self.next_run

    def update_schedule(self):
        """次回実行時刻を更新"""
        self.last_run = datetime.utcnow()
        self.next_run = self.last_run + timedelta(minutes=self.interval_minutes)


class TaskScheduler:
    """タスクスケジューラ"""

    def __init__(self):
        self.jobs: dict[str, ScheduledJob] = {}
        self._running = False
        self._task: Optional[asyncio.Task] = None

    def add_job(
        self,
        name: str,
        func: Callable,
        interval_minutes: int,
        **kwargs,
    ):
        """
        ジョブを追加

        Args:
            name: ジョブ名
            func: 実行する非同期関数
            interval_minutes: 実行間隔（分）
            **kwargs: 関数に渡す追加引数
        """
        self.jobs[name] = ScheduledJob(
            name=name,
            func=func,
            interval_minutes=interval_minutes,
            kwargs=kwargs,
        )
        logger.info(f"Added job: {name} (interval: {interval_minutes} min)")

    def remove_job(self, name: str):
        """ジョブを削除"""
        if name in self.jobs:
            del self.jobs[name]
            logger.info(f"Removed job: {name}")

    async def run_job(self, name: str) -> Optional[dict]:
        """
        ジョブを即座に実行

        Args:
            name: ジョブ名

        Returns:
            実行結果
        """
        if name not in self.jobs:
            logger.error(f"Job not found: {name}")
            return None

        job = self.jobs[name]

        if job.is_running:
            logger.warning(f"Job {name} is already running")
            return None

        job.is_running = True

        try:
            logger.info(f"Running job: {name}")
            result = await job.func(**job.kwargs)
            job.run_count += 1
            job.update_schedule()
            logger.info(f"Job {name} completed successfully")
            return result

        except Exception as e:
            job.error_count += 1
            logger.error(f"Job {name} failed: {e}")
            raise

        finally:
            job.is_running = False

    async def _scheduler_loop(self):
        """スケジューラのメインループ"""
        logger.info("Scheduler started")

        while self._running:
            for name, job in self.jobs.items():
                if job.should_run():
                    try:
                        await self.run_job(name)
                    except Exception as e:
                        logger.error(f"Error running job {name}: {e}")

            # 1分ごとにチェック
            await asyncio.sleep(60)

        logger.info("Scheduler stopped")

    def start(self):
        """スケジューラを開始"""
        if self._running:
            logger.warning("Scheduler is already running")
            return

        self._running = True
        self._task = asyncio.create_task(self._scheduler_loop())

    def stop(self):
        """スケジューラを停止"""
        self._running = False
        if self._task:
            self._task.cancel()

    def get_status(self) -> dict:
        """スケジューラの状態を取得"""
        return {
            "running": self._running,
            "jobs": {
                name: {
                    "interval_minutes": job.interval_minutes,
                    "last_run": job.last_run.isoformat() if job.last_run else None,
                    "next_run": job.next_run.isoformat() if job.next_run else None,
                    "is_running": job.is_running,
                    "run_count": job.run_count,
                    "error_count": job.error_count,
                }
                for name, job in self.jobs.items()
            },
        }


# グローバルスケジューラインスタンス
_scheduler: Optional[TaskScheduler] = None


def get_scheduler() -> TaskScheduler:
    """スケジューラのシングルトンを取得"""
    global _scheduler
    if _scheduler is None:
        _scheduler = TaskScheduler()
    return _scheduler


def setup_default_jobs(scheduler: TaskScheduler):
    """デフォルトのジョブを設定"""
    from app.tasks.analysis_task import run_analysis_batch

    # 未解析店舗の解析（1時間ごと）
    scheduler.add_job(
        name="analyze_unanalyzed",
        func=run_analysis_batch,
        interval_minutes=60,
        task_type="unanalyzed",
        limit=20,
    )

    # 古い解析結果の更新（6時間ごと）
    scheduler.add_job(
        name="analyze_outdated",
        func=run_analysis_batch,
        interval_minutes=360,
        task_type="outdated",
        limit=10,
        days_threshold=30,
    )
