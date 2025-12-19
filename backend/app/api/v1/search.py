"""
AI検索API
自然言語による店舗検索
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db

router = APIRouter()


class ChatSearchRequest(BaseModel):
    """チャット検索リクエスト"""
    query: str
    limit: int = 5


class SearchResultItem(BaseModel):
    """検索結果アイテム"""
    shop_id: str
    shop_name: str
    relevance_score: float
    matched_reviews: list[dict]
    analytics: Optional[dict] = None


class ChatSearchResponse(BaseModel):
    """チャット検索レスポンス"""
    query: str
    answer: str
    results: list[SearchResultItem]
    total_results: int


class EmbeddingRequest(BaseModel):
    """埋め込みリクエスト"""
    limit: int = 100


class EmbeddingResponse(BaseModel):
    """埋め込みレスポンス"""
    total_reviews: int
    embedded: int
    skipped: int
    failed: int
    errors: list[str]


class TranslationRequest(BaseModel):
    """翻訳リクエスト"""
    limit: int = 50


class TranslationResponse(BaseModel):
    """翻訳レスポンス"""
    total_reviews: int
    translated: int
    skipped: int
    failed: int
    errors: list[str]


@router.post("/chat", response_model=ChatSearchResponse)
async def chat_search(
    request: ChatSearchRequest,
    db: Session = Depends(get_db),
):
    """
    自然言語でメンズエステ店を検索

    入力例:
    - "静かで、あまり話しかけてこない店"
    - "技術重視で、サクラが少なそうな店"
    - "新宿で安全な店を教えて"
    """
    from app.ai.rag_search import RAGSearchService

    if not request.query or len(request.query.strip()) < 2:
        raise HTTPException(status_code=400, detail="検索クエリは2文字以上入力してください")

    search_service = RAGSearchService(db)

    try:
        result = await search_service.chat_search(
            query=request.query,
            limit=request.limit,
        )

        return ChatSearchResponse(
            query=result.query,
            answer=result.answer,
            results=[
                SearchResultItem(
                    shop_id=r.shop_id,
                    shop_name=r.shop_name,
                    relevance_score=r.relevance_score,
                    matched_reviews=r.matched_reviews,
                    analytics=r.analytics,
                )
                for r in result.results
            ],
            total_results=result.total_results,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"検索エラー: {str(e)}")


@router.get("/vector")
async def vector_search(
    query: str = Query(..., min_length=2, description="検索クエリ"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    ベクトル類似度検索（デバッグ用）

    レビューテキストとの類似度が高いものを返す
    """
    from app.ai.rag_search import RAGSearchService

    search_service = RAGSearchService(db)

    try:
        results = await search_service.vector_search(
            query=query,
            limit=limit,
        )

        return {
            "query": query,
            "results": results,
            "total": len(results),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"検索エラー: {str(e)}")


@router.get("/structured")
def structured_search(
    min_score: Optional[int] = Query(None, ge=0, le=10, description="最低平均スコア"),
    max_sakura_risk: Optional[int] = Query(None, ge=0, le=100, description="最大サクラリスク"),
    risk_levels: Optional[str] = Query(None, description="リスクレベル（カンマ区切り: safe,gamble,mine,fake）"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="最低Google評価"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    構造化条件で店舗を検索
    """
    from app.ai.rag_search import StructuredSearchService
    from app.services.shop_service import ShopService

    search_service = StructuredSearchService(db)

    # リスクレベルをリストに変換
    risk_level_list = None
    if risk_levels:
        risk_level_list = [r.strip() for r in risk_levels.split(",")]

    shops = search_service.search_by_criteria(
        min_score=min_score,
        max_sakura_risk=max_sakura_risk,
        risk_levels=risk_level_list,
        min_rating=min_rating,
        limit=limit,
    )

    return {
        "results": [ShopService.shop_to_response(shop) for shop in shops],
        "total": len(shops),
        "filters": {
            "min_score": min_score,
            "max_sakura_risk": max_sakura_risk,
            "risk_levels": risk_level_list,
            "min_rating": min_rating,
        },
    }


@router.post("/embeddings/generate", response_model=EmbeddingResponse)
async def generate_embeddings(
    request: EmbeddingRequest,
    db: Session = Depends(get_db),
):
    """
    レビューのベクトル埋め込みを生成

    埋め込みがまだ生成されていないレビューを対象に処理
    """
    from app.ai.embeddings import ReviewEmbeddingService

    embedding_service = ReviewEmbeddingService(db)

    try:
        result = await embedding_service.embed_reviews(limit=request.limit)

        return EmbeddingResponse(
            total_reviews=result.total_reviews,
            embedded=result.embedded,
            skipped=result.skipped,
            failed=result.failed,
            errors=result.errors,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"埋め込み生成エラー: {str(e)}")


@router.get("/embeddings/status")
def get_embedding_status(
    db: Session = Depends(get_db),
):
    """
    埋め込み状況を確認
    """
    from app.models.review import Review
    from sqlalchemy import func

    total_reviews = db.query(func.count(Review.id)).scalar()
    embedded_reviews = (
        db.query(func.count(Review.id))
        .filter(Review.embedding.isnot(None))
        .scalar()
    )
    pending_reviews = total_reviews - embedded_reviews

    return {
        "total_reviews": total_reviews,
        "embedded_reviews": embedded_reviews,
        "pending_reviews": pending_reviews,
        "embedding_rate": (
            round(embedded_reviews / total_reviews * 100, 1)
            if total_reviews > 0
            else 0
        ),
    }


@router.post("/translations/generate", response_model=TranslationResponse)
async def generate_translations(
    request: TranslationRequest,
    db: Session = Depends(get_db),
):
    """
    レビューの日本語翻訳を生成

    日本語以外のレビューで、まだ翻訳がないものを対象に処理
    """
    from app.services.review_service import ReviewService
    from app.ai.translator import get_translator_service

    review_service = ReviewService(db)
    translator = get_translator_service()

    result = TranslationResponse(
        total_reviews=0,
        translated=0,
        skipped=0,
        failed=0,
        errors=[],
    )

    try:
        # 翻訳が必要なレビューを取得
        reviews = review_service.get_reviews_without_translation(limit=request.limit)
        result.total_reviews = len(reviews)

        if not reviews:
            return result

        # テキストと言語を抽出
        texts_with_lang = [(r.text, r.language) for r in reviews if r.text]

        # バッチ翻訳
        translations = await translator.batch_translate_to_japanese(texts_with_lang)

        # DBに保存
        for review, translated_text in zip(reviews, translations):
            try:
                if translated_text and translated_text != review.text:
                    review_service.update_text_ja(review.id, translated_text)
                    result.translated += 1
                else:
                    result.skipped += 1
            except Exception as e:
                result.failed += 1
                result.errors.append(f"Review {review.id}: {str(e)}")

        return result

    except Exception as e:
        result.errors.append(f"Batch translation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"翻訳エラー: {str(e)}")


@router.get("/translations/status")
def get_translation_status(
    db: Session = Depends(get_db),
):
    """
    翻訳状況を確認
    """
    from app.models.review import Review
    from sqlalchemy import func

    # 全レビュー数
    total_reviews = db.query(func.count(Review.id)).scalar()

    # 日本語レビュー数（翻訳不要）
    ja_reviews = (
        db.query(func.count(Review.id))
        .filter(Review.language == "ja")
        .scalar()
    )

    # 翻訳済みレビュー数
    translated_reviews = (
        db.query(func.count(Review.id))
        .filter(Review.text_ja.isnot(None))
        .filter(Review.language != "ja")
        .scalar()
    )

    # 翻訳待ちレビュー数
    pending_reviews = total_reviews - ja_reviews - translated_reviews

    return {
        "total_reviews": total_reviews,
        "japanese_reviews": ja_reviews,
        "translated_reviews": translated_reviews,
        "pending_reviews": pending_reviews,
        "translation_rate": (
            round((ja_reviews + translated_reviews) / total_reviews * 100, 1)
            if total_reviews > 0
            else 0
        ),
    }
