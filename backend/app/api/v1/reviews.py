from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.review_service import ReviewService
from app.schemas.review import ReviewResponse

router = APIRouter()


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(
    review_id: UUID,
    db: Session = Depends(get_db),
):
    """レビュー詳細を取得"""
    review_service = ReviewService(db)
    review = review_service.get_by_id(review_id)

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    return review
