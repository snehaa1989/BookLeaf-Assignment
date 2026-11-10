
from app.database import SessionLocal
from app.models import Author, Book

db = SessionLocal()

try:
    authors = db.query(Author).all()
    books = db.query(Book).all()

    print("Authors:", len(authors))
    print("Books:", len(books))

    print("\nAuthor records:")

    for author in authors:
        print(
            author.id,
            "|",
            author.name,
            "|",
            author.email,
            "| Books:",
            len(author.books),
        )

    print("\nAdmin accounts:")

    admins = db.query(Author).filter(
        Author.role == "admin"
    ).all()

    for admin in admins:
        print(admin.email, "|", admin.role)

finally:
    db.close()
