"""
レビュー解析用プロンプトテンプレート
"""

REVIEW_ANALYSIS_SYSTEM_PROMPT = """あなたはメンズエステ店のレビューを分析する専門家です。
ユーザーの安全を第一に考え、客観的かつ厳格にレビューを評価してください。
サクラレビューや誇張表現を見抜き、実際の利用者にとって有益な情報を抽出することが目的です。"""

REVIEW_ANALYSIS_PROMPT = """
以下のメンズエステ店のレビュー群を分析し、指定のJSON形式で評価してください。

## 店舗情報
- 店舗名: {shop_name}
- 住所: {shop_address}
- Google評価: {google_rating}（{review_count}件）

## 評価軸（各10点満点、点数が高いほど安全・良好）

### 1. score_operation（運営のまともさ）
評価ポイント:
- 予約システムの円滑さ
- 電話・メール対応の丁寧さ
- 時間管理（遅刻・早切り上げがないか）
- キャンセルポリシーの明確さ

減点要素:
- 「予約が取れない」「電話が繋がらない」
- 「時間通りに始まらない」「早く終わった」
- 「対応が雑」「不親切」

### 2. score_accuracy（情報の正確性）
評価ポイント:
- 写真と実物の一致度
- 年齢・スペック情報の正確さ
- サービス内容の説明との一致

減点要素（重大）:
- 「写真と違う」「パネマジ」「別人」
- 「年齢詐称」「サバ読み」
- 「説明と違うサービス」

### 3. score_hygiene（衛生・環境）
評価ポイント:
- 部屋の清潔感
- タオル・シーツの清潔さ
- 換気・空調の状態
- 騒音レベル

減点要素:
- 「汚い」「臭い」「カビ」
- 「うるさい」「壁が薄い」
- 「タオルが汚れていた」

### 4. score_sincerity（施術の誠実さ）
評価ポイント:
- 技術レベル
- 施術への集中度
- 手抜きがないか

減点要素:
- 「手抜き」「雑」「適当」
- 「スマホをいじっていた」「時計を気にしていた」
- 「マニュアル通り」「心がこもっていない」

### 5. score_safety（心理的安全性）
評価ポイント:
- 接客態度の良さ
- プレッシャーのなさ
- 要望への対応

減点要素:
- 「強引な勧誘」「オプション押し」
- 「態度が悪い」「威圧的」
- 「嫌な思いをした」

## 特殊判定

### sakura_risk（サクラ汚染度: 0-100%）
以下の特徴を持つレビューの割合を算出:
- 具体性がない短文（「最高」「神」「また行く」のみ）
- 全てが絶賛で欠点の言及がない
- 不自然に同じ表現が繰り返される
- 投稿時期が集中している

### variance_score（ギャンブル度: 0-100）
レビュー評価のばらつきを数値化:
- 0: 評価が安定（全て高評価 or 全て低評価）
- 50: 普通のばらつき
- 100: 評価が極端に分かれる（当たり外れが激しい）

## リスクレベル判定基準

- **safe**: 平均スコア7以上、sakura_risk 30%未満、重大な問題なし
- **gamble**: variance_score 60以上（賛否両論）
- **mine**: score_accuracy 3以下、または平均スコア4以下
- **fake**: sakura_risk 80%以上

## 出力JSON形式

```json
{{
  "score_operation": <int: 0-10>,
  "score_accuracy": <int: 0-10>,
  "score_hygiene": <int: 0-10>,
  "score_sincerity": <int: 0-10>,
  "score_safety": <int: 0-10>,
  "variance_score": <float: 0-100>,
  "sakura_risk": <int: 0-100>,
  "risk_level": "<string: safe|gamble|mine|fake>",
  "risk_summary": "<string: ネガティブ要素を中心とした3行以内の要約>",
  "positive_points": ["<string: 良い点1>", "<string: 良い点2>", ...],
  "negative_points": ["<string: 悪い点・注意点1>", "<string: 悪い点・注意点2>", ...]
}}
```

## 分析対象レビュー（{review_count}件）

{reviews_text}

---

上記のレビューを分析し、JSON形式で結果を出力してください。
レビューが少ない場合や情報が不十分な場合は、判断できる範囲で評価し、risk_summaryにその旨を記載してください。
"""


def format_reviews_for_analysis(reviews: list[dict]) -> str:
    """
    レビューリストをプロンプト用のテキストに整形

    Args:
        reviews: レビューのリスト

    Returns:
        整形されたテキスト
    """
    formatted_parts = []

    for i, review in enumerate(reviews, 1):
        rating = review.get("rating", "N/A")
        text = review.get("text", "").strip()
        author = review.get("author_name", "匿名")
        time_desc = review.get("relative_time_description", "")

        if not text:
            text = "(テキストなし)"

        formatted_parts.append(
            f"### レビュー {i}\n"
            f"- 評価: {'★' * rating if isinstance(rating, int) else rating}\n"
            f"- 投稿者: {author}\n"
            f"- 投稿時期: {time_desc}\n"
            f"- 内容:\n{text}\n"
        )

    return "\n".join(formatted_parts)


def build_analysis_prompt(
    shop_name: str,
    shop_address: str,
    google_rating: float,
    reviews: list[dict],
) -> str:
    """
    解析用プロンプトを構築

    Args:
        shop_name: 店舗名
        shop_address: 住所
        google_rating: Google評価
        reviews: レビューリスト

    Returns:
        完成したプロンプト
    """
    reviews_text = format_reviews_for_analysis(reviews)

    return REVIEW_ANALYSIS_PROMPT.format(
        shop_name=shop_name,
        shop_address=shop_address or "不明",
        google_rating=google_rating or "N/A",
        review_count=len(reviews),
        reviews_text=reviews_text,
    )


# 少数レビュー用の簡易プロンプト
MINIMAL_REVIEW_PROMPT = """
以下のメンズエステ店について、少数のレビューから可能な範囲で評価してください。

## 店舗情報
- 店舗名: {shop_name}
- Google評価: {google_rating}（{review_count}件）

## レビュー
{reviews_text}

## 出力形式
レビュー数が少ないため、確信度の低い評価となります。
以下のJSON形式で出力してください。スコアは慎重に中央値（5-6）付近に寄せてください。

```json
{{
  "score_operation": <int: 0-10>,
  "score_accuracy": <int: 0-10>,
  "score_hygiene": <int: 0-10>,
  "score_sincerity": <int: 0-10>,
  "score_safety": <int: 0-10>,
  "variance_score": <float: 0-100>,
  "sakura_risk": <int: 0-100>,
  "risk_level": "<string: safe|gamble|mine|fake>",
  "risk_summary": "<string: レビュー数が少ないため参考程度。確認できた情報の要約>",
  "positive_points": ["<string>"],
  "negative_points": ["<string>"]
}}
```
"""


def build_minimal_analysis_prompt(
    shop_name: str,
    google_rating: float,
    reviews: list[dict],
) -> str:
    """
    少数レビュー用の簡易プロンプトを構築
    """
    reviews_text = format_reviews_for_analysis(reviews)

    return MINIMAL_REVIEW_PROMPT.format(
        shop_name=shop_name,
        google_rating=google_rating or "N/A",
        review_count=len(reviews),
        reviews_text=reviews_text,
    )
