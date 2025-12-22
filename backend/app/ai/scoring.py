"""
スコアリングロジック
LLM出力の後処理とリスクレベル判定
"""

from pydantic import BaseModel, Field, field_validator


class AnalysisResult(BaseModel):
    """LLM解析結果のスキーマ"""

    score_operation: int = Field(..., ge=0, le=10)
    score_accuracy: int = Field(..., ge=0, le=10)
    score_hygiene: int = Field(..., ge=0, le=10)
    score_sincerity: int = Field(..., ge=0, le=10)
    score_safety: int = Field(..., ge=0, le=10)
    variance_score: float = Field(..., ge=0, le=100)
    sakura_risk: int = Field(..., ge=0, le=100)
    risk_level: str = Field(...)
    risk_summary: str = Field(default="")
    positive_points: list[str] = Field(default_factory=list)
    negative_points: list[str] = Field(default_factory=list)

    @field_validator("risk_level")
    @classmethod
    def validate_risk_level(cls, v: str) -> str:
        valid_levels = {"safe", "gamble", "mine", "fake"}
        if v.lower() not in valid_levels:
            # 自動補正を試みる
            return "gamble"  # デフォルト
        return v.lower()

    @field_validator("positive_points", "negative_points", mode="before")
    @classmethod
    def ensure_list(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v]
        return v


def calculate_average_score(result: AnalysisResult) -> float:
    """5軸スコアの平均を計算"""
    return (
        result.score_operation
        + result.score_accuracy
        + result.score_hygiene
        + result.score_sincerity
        + result.score_safety
    ) / 5


def determine_risk_level(
    result: AnalysisResult,
    override_llm: bool = True,
) -> str:
    """
    リスクレベルを判定（改善版：gambleを減らしsafeを増やす）

    Args:
        result: LLM解析結果
        override_llm: LLMの判定を上書きするかどうか

    Returns:
        リスクレベル（safe/gamble/mine/fake）
    """
    if not override_llm:
        return result.risk_level

    avg_score = calculate_average_score(result)

    # 判定ロジック（優先順位順）

    # 1. サクラ汚染度が高い → fake
    if result.sakura_risk >= 60:
        return "fake"

    # 2. 情報の正確性が著しく低い → mine
    if result.score_accuracy <= 3:
        return "mine"

    # 3. 平均スコアが非常に低い → mine（閾値を4→3.5に厳格化）
    if avg_score <= 3.5:
        return "mine"

    # 4. 安全性スコアが著しく低い → mine
    if result.score_safety <= 2:
        return "mine"

    # 5. ばらつきが大きい → gamble（閾値を50→60に緩和）
    if result.variance_score >= 60:
        return "gamble"

    # 6. サクラ疑惑が中程度 → gamble
    if 40 <= result.sakura_risk < 60:
        return "gamble"

    # 7. 平均スコアが良く、問題がない → safe（条件緩和）
    if avg_score >= 5.5 and result.sakura_risk < 50 and result.variance_score < 60:
        return "safe"

    # 8. デフォルト: 中間評価はsafeに（閾値を5→4.5に緩和）
    if avg_score >= 4.5:
        return "safe"

    return "gamble"


def calculate_variance_from_ratings(ratings: list[int]) -> float:
    """
    評価値リストから分散スコアを計算

    Args:
        ratings: 評価値（1-5）のリスト

    Returns:
        分散スコア（0-100）
    """
    if not ratings or len(ratings) < 2:
        return 50.0  # データ不足時は中央値

    import statistics

    try:
        variance = statistics.variance(ratings)
        # 最大分散は (5-1)^2 / 4 = 4 （1と5が半々の場合）
        # これを0-100にスケール
        normalized = min(variance / 4 * 100, 100)
        return round(normalized, 1)
    except statistics.StatisticsError:
        return 50.0


def detect_sakura_reviews(reviews: list[dict]) -> tuple[int, list[str]]:
    """
    サクラレビューの検出

    Args:
        reviews: レビューリスト

    Returns:
        (サクラ疑惑度 0-100, 疑わしいレビューのリスト)
    """
    if not reviews:
        return 0, []

    suspicious_reviews = []
    sakura_indicators = 0

    # サクラの特徴パターン
    short_praise_patterns = [
        "最高",
        "神",
        "また行く",
        "また来ます",
        "リピ確定",
        "おすすめ",
        "良かった",
        "満足",
        "文句なし",
    ]

    for review in reviews:
        text = review.get("text", "").strip()
        rating = review.get("rating", 0)

        is_suspicious = False
        reasons = []

        # 短文チェック（30文字未満）
        if len(text) < 30:
            # かつ高評価の場合
            if rating and rating >= 4:
                is_suspicious = True
                reasons.append("短文高評価")

        # 具体性のない絶賛チェック
        praise_count = sum(1 for p in short_praise_patterns if p in text)
        if praise_count >= 2 and len(text) < 100:
            is_suspicious = True
            reasons.append("定型句の多用")

        # テキストなしで高評価
        if not text and rating and rating >= 4:
            is_suspicious = True
            reasons.append("テキストなし高評価")

        if is_suspicious:
            suspicious_reviews.append(
                {
                    "text": text[:50] + "..." if len(text) > 50 else text,
                    "reasons": reasons,
                }
            )
            sakura_indicators += 1

    # サクラ疑惑度を計算（疑わしいレビューの割合）
    sakura_risk = int((sakura_indicators / len(reviews)) * 100)

    return sakura_risk, suspicious_reviews


def post_process_analysis(
    llm_result: dict,
    reviews: list[dict],
) -> AnalysisResult:
    """
    LLM出力の後処理とバリデーション

    Args:
        llm_result: LLMの出力（dict）
        reviews: 元のレビューリスト

    Returns:
        検証済みの解析結果
    """
    # Pydanticでバリデーション
    try:
        result = AnalysisResult.model_validate(llm_result)
    except Exception:
        # バリデーションエラー時はデフォルト値で補完
        result = AnalysisResult(
            score_operation=llm_result.get("score_operation", 5),
            score_accuracy=llm_result.get("score_accuracy", 5),
            score_hygiene=llm_result.get("score_hygiene", 5),
            score_sincerity=llm_result.get("score_sincerity", 5),
            score_safety=llm_result.get("score_safety", 5),
            variance_score=llm_result.get("variance_score", 50),
            sakura_risk=llm_result.get("sakura_risk", 50),
            risk_level=llm_result.get("risk_level", "gamble"),
            risk_summary=llm_result.get("risk_summary", "解析結果の検証でエラーが発生"),
            positive_points=llm_result.get("positive_points", []),
            negative_points=llm_result.get("negative_points", []),
        )

    # レビューから追加の検証
    if reviews:
        ratings = [r.get("rating") for r in reviews if r.get("rating")]

        # variance_score の補正
        if ratings:
            calculated_variance = calculate_variance_from_ratings(ratings)
            # LLMの値と計算値の平均を取る
            result.variance_score = (result.variance_score + calculated_variance) / 2

        # sakura_risk の補正
        detected_risk, _ = detect_sakura_reviews(reviews)
        # LLMの値と検出値の高い方を採用（保守的に）
        result.sakura_risk = max(result.sakura_risk, detected_risk)

    # リスクレベルを再判定
    result.risk_level = determine_risk_level(result)

    return result


def create_default_analysis(
    reason: str = "レビューが不足しているため解析できません",
) -> AnalysisResult:
    """
    デフォルトの解析結果を生成（レビュー不足時など）
    """
    # 一時的な結果を作成
    temp_result = AnalysisResult(
        score_operation=5,
        score_accuracy=5,
        score_hygiene=5,
        score_sincerity=5,
        score_safety=5,
        variance_score=50,
        sakura_risk=0,
        risk_level="gamble",  # 仮の値
        risk_summary=reason,
        positive_points=["データ不足のため評価保留"],
        negative_points=["データ不足のため評価保留"],
    )
    # determine_risk_level で正しいリスクレベルを判定
    temp_result.risk_level = determine_risk_level(temp_result)
    return temp_result
