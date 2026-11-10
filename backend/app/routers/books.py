
import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Author, Book
from app.security import get_current_user
from app.schemas import BookResponse

router = APIRouter(
    prefix="/api/books",
    tags=["Books"],
)


@router.get("/my-books", response_model=list[BookResponse])
def get_my_books(
    user: Author = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    books = db.query(Book).filter(
        Book.author_id == user.id
    ).all()

    return [
        {
            "id": book.id,
            "author_id": book.author_id,
            "title": book.title,
            "isbn": book.isbn,
            "genre": book.genre,
            "publication_date": book.publication_date,
            "status": book.status,
            "mrp": book.mrp,
            "author_royalty_per_copy": book.author_royalty_per_copy,
            "total_copies_sold": book.total_copies_sold,
            "total_royalty_earned": book.total_royalty_earned,
            "royalty_paid": book.royalty_paid,
            "royalty_pending": book.royalty_pending,
            "last_royalty_payout_date": book.last_royalty_payout_date,
            "print_partner": book.print_partner,
            "available_on": json.loads(book.available_on_json or "[]"),
        }
        for book in books
    ]
