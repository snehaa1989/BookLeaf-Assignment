
import json
from datetime import date
from pathlib import Path

from app.database import Base, engine, SessionLocal
from app.models import Author, Book
from app.config import settings
from app.security import hash_password


DATA_PATH = Path(__file__).resolve().parent / "seed" / "authors_books.json"


def parse_date(value):
    if not value:
        return None

    return date.fromisoformat(value)


def seed_database():
    Base.metadata.create_all(bind=engine)

    with DATA_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    db = SessionLocal()

    try:
        if db.query(Author).first():
            print("Database already seeded. Skipping.")
            return

        # Seed authors and their books from the provided dataset
        for author_data in data["authors"]:
            author = Author(
                id=author_data["author_id"],
                name=author_data["name"],
                email=author_data["email"],
                phone=author_data.get("phone"),
                city=author_data.get("city"),
                joined_date=parse_date(
                    author_data.get("joined_date")
                ),
                password_hash=hash_password(
                    settings.seeded_author_password
                ),
                role="author",
            )

            db.add(author)

            for book_data in author_data.get("books", []):
                book = Book(
                    id=book_data["book_id"],
                    author_id=author_data["author_id"],
                    title=book_data["title"],
                    isbn=book_data.get("isbn"),
                    genre=book_data.get("genre"),
                    publication_date=parse_date(
                        book_data.get("publication_date")
                    ),
                    status=book_data["status"],
                    mrp=book_data.get("mrp"),
                    author_royalty_per_copy=book_data.get(
                        "author_royalty_per_copy"
                    ),
                    total_copies_sold=book_data.get(
                        "total_copies_sold", 0
                    ),
                    total_royalty_earned=book_data.get(
                        "total_royalty_earned", 0
                    ),
                    royalty_paid=book_data.get(
                        "royalty_paid", 0
                    ),
                    royalty_pending=book_data.get(
                        "royalty_pending", 0
                    ),
                    last_royalty_payout_date=parse_date(
                        book_data.get(
                            "last_royalty_payout_date"
                        )
                    ),
                    print_partner=book_data.get("print_partner"),
                    available_on_json=json.dumps(
                        book_data.get("available_on", [])
                    ),
                )

                db.add(book)

        # Create the admin account
        admin = Author(
            id="ADMIN001",
            name="BookLeaf Admin",
            email=settings.admin_email,
            phone=None,
            city=None,
            joined_date=date.today(),
            password_hash=hash_password(
                settings.admin_password
            ),
            role="admin",
        )

        db.add(admin)
        db.commit()

        print("Database seeded successfully!")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
