"""
レビュー解析エンジン
店舗のレビューをLLMで解析し、リスクスコアを算出
"""

import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.ai.llm_client import GeminiClient, get_gemini_client
from app.ai.prompts import (
    REVIEW_ANALYSIS_SYSTEM_PROMPT,
    build_analysis_prompt,
    build_minimal_analysis_prompt,
)
from app.ai.scoring import (
    AnalysisResult,
    create_default_analysis,
    post_process_analysis,
)
from app.models.analytics import ShopAIAnalytics
from app.models.review import Review
from app.models.shop import Shop

logger = logging.getLogger(__name__)

# 解析に必要な最小レビュー数
MIN_REVIEWS_FOR_ANALYSIS = 3
# 詳細解析に必要なレビュー数
MIN_REVIEWS_FOR_DETAILED_ANALYSIS = 5
# 解析バージョン
ANALYSIS_VERSION = "1.0.0"


class ReviewAnalyzer:
    """レビュー解析エンジン"""

    def __init__(self, db: Session, llm_client: Optional[GeminiClient] = None):
        self.db = db
        self.llm_client = llm_client or get_gemini_client()

    async def analyze_shop(
        self,
        shop_id: UUID,
        force: bool = False,
    ) -> Optional[ShopAIAnalytics]:
        """
        店舗のレビューを解析

        Args:
            shop_id: 店舗ID
            force: 既存の解析結果を上書きするか

        Returns:
            解析結果（ShopAIAnalytics）またはNone
        """
        # 店舗情報を取得
        shop = self.db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            logger.error(f"Shop not found: {shop_id}")
            return None

        # 既存の解析結果をチェック
        existing_analytics = (
            self.db.query(ShopAIAnalytics).filter(ShopAIAnalytics.shop_id == shop_id).first()
        )

        if existing_analytics and not force:
            logger.info(f"Analytics already exists for shop {shop_id}")
            return existing_analytics

        # レビューを取得
        reviews = (
            self.db.query(Review)
            .filter(Review.shop_id == shop_id)
            .order_by(Review.time.desc())
            .limit(50)  # 最新50件まで
            .all()
        )

        reviews_data = [
            {
                "rating": r.rating,
                "text": r.text,
                "author_name": r.author_name,
                "relative_time_description": r.relative_time_description,
            }
            for r in reviews
        ]

        # 解析実行
        result = await self._run_analysis(shop, reviews_data)

        # 結果をDBに保存
        analytics = self._save_analytics(shop_id, result, len(reviews_data), existing_analytics)

        return analytics

    async def _run_analysis(
        self,
        shop: Shop,
        reviews: list[dict],
    ) -> AnalysisResult:
        """
        LLMによる解析を実行

        Args:
            shop: 店舗情報
            reviews: レビューリスト

        Returns:
            解析結果
        """
        # レビュー数チェック
        if len(reviews) < MIN_REVIEWS_FOR_ANALYSIS:
            logger.warning(
                f"Not enough reviews for shop {shop.id}: {len(reviews)} < {MIN_REVIEWS_FOR_ANALYSIS}"
            )
            return create_default_analysis(
                f"レビュー数が{MIN_REVIEWS_FOR_ANALYSIS}件未満のため、十分な解析ができません"
            )

        # プロンプト構築
        if len(reviews) >= MIN_REVIEWS_FOR_DETAILED_ANALYSIS:
            prompt = build_analysis_prompt(
                shop_name=shop.name,
                shop_address=shop.formatted_address,
                google_rating=shop.rating,
                reviews=reviews,
            )
        else:
            prompt = build_minimal_analysis_prompt(
                shop_name=shop.name,
                google_rating=shop.rating,
                reviews=reviews,
            )

        # 全体プロンプト（システムプロンプト + 解析プロンプト）
        full_prompt = f"{REVIEW_ANALYSIS_SYSTEM_PROMPT}\n\n{prompt}"

        try:
            # LLM呼び出し
            logger.info(f"Analyzing shop {shop.id} ({shop.name}) with {len(reviews)} reviews")
            llm_result = await self.llm_client.generate_json(full_prompt)

            # 後処理とバリデーション
            result = post_process_analysis(llm_result, reviews)

            logger.info(
                f"Analysis complete for {shop.id}: "
                f"risk_level={result.risk_level}, "
                f"avg_score={(result.score_operation + result.score_accuracy + result.score_hygiene + result.score_sincerity + result.score_safety) / 5:.1f}"
            )

            return result

        except Exception as e:
            logger.error(f"Analysis failed for shop {shop.id}: {e}")
            return create_default_analysis(f"解析中にエラーが発生しました: {str(e)[:100]}")

    def _save_analytics(
        self,
        shop_id: UUID,
        result: AnalysisResult,
        review_count: int,
        existing: Optional[ShopAIAnalytics] = None,
    ) -> ShopAIAnalytics:
        """
        解析結果をDBに保存

        Args:
            shop_id: 店舗ID
            result: 解析結果
            review_count: 解析したレビュー数
            existing: 既存の解析結果（更新時）

        Returns:
            保存されたShopAIAnalytics
        """
        if existing:
            analytics = existing
        else:
            analytics = ShopAIAnalytics(shop_id=shop_id)
            self.db.add(analytics)

        # 値を設定
        analytics.score_operation = result.score_operation
        analytics.score_accuracy = result.score_accuracy
        analytics.score_hygiene = result.score_hygiene
        analytics.score_sincerity = result.score_sincerity
        analytics.score_safety = result.score_safety
        analytics.variance_score = result.variance_score
        analytics.sakura_risk = result.sakura_risk
        analytics.risk_level = result.risk_level
        analytics.risk_summary = result.risk_summary
        analytics.positive_points = result.positive_points
        analytics.negative_points = result.negative_points
        analytics.analyzed_review_count = review_count
        analytics.analysis_version = ANALYSIS_VERSION
        analytics.last_analyzed_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(analytics)

        return analytics

    async def analyze_multiple_shops(
        self,
        shop_ids: list[UUID],
        force: bool = False,
    ) -> dict:
        """
        複数店舗を解析

        Args:
            shop_ids: 店舗IDリスト
            force: 既存の解析結果を上書きするか

        Returns:
            結果サマリー
        """
        results = {
            "total": len(shop_ids),
            "success": 0,
            "skipped": 0,
            "failed": 0,
            "errors": [],
        }

        for shop_id in shop_ids:
            try:
                analytics = await self.analyze_shop(shop_id, force=force)
                if analytics:
                    results["success"] += 1
                else:
                    results["skipped"] += 1
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(
                    {
                        "shop_id": str(shop_id),
                        "error": str(e),
                    }
                )
                logger.error(f"Failed to analyze shop {shop_id}: {e}")

        return results

    def get_unanalyzed_shops(self, limit: int = 50) -> list[Shop]:
        """
        未解析の店舗を取得

        Args:
            limit: 最大取得件数

        Returns:
            未解析の店舗リスト
        """
        return (
            self.db.query(Shop)
            .outerjoin(ShopAIAnalytics)
            .filter(ShopAIAnalytics.shop_id.is_(None))
            .limit(limit)
            .all()
        )

    def get_outdated_shops(
        self,
        days_threshold: int = 30,
        limit: int = 50,
    ) -> list[Shop]:
        """
        解析結果が古い店舗を取得

        Args:
            days_threshold: 古いとみなす日数
            limit: 最大取得件数

        Returns:
            店舗リスト
        """
        from datetime import timedelta

        threshold_date = datetime.utcnow() - timedelta(days=days_threshold)

        return (
            self.db.query(Shop)
            .join(ShopAIAnalytics)
            .filter(ShopAIAnalytics.last_analyzed_at < threshold_date)
            .limit(limit)
            .all()
        )
