
import os

from app.database import SessionLocal, engine
from app.models import Author
from app.security import hash_password


def sync_passwords():
    # Safety check: never run against a local SQLite database.
    if engine.dialect.name != "postgresql":
        raise RuntimeError(
            "Password synchronization requires PostgreSQL."
        )

    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    author_password = os.getenv("SEEDED_AUTHOR_PASSWORD")

    # Require explicitly configured Render environment variables.
    if not all([admin_email, admin_password, author_password]):
        raise RuntimeError(
            "Required password environment variables are missing."
        )

    # Prevent accidental use of the application's default passwords.
    if admin_password == "Admin@123":
        raise RuntimeError("Default admin password is not allowed.")

    if author_password == "BookLeaf@123":
        raise RuntimeError("Default author password is not allowed.")

    db = SessionLocal()

    try:
        admins = db.query(Author).filter(
            Author.role == "admin"
        ).all()

        authors = db.query(Author).filter(
            Author.role == "author"
        ).all()

        # Validate expected production account counts.
        if len(admins) != 1:
            raise RuntimeError(
                f"Expected 1 admin account; found {len(admins)}."
            )

        if len(authors) != 10:
            raise RuntimeError(
                f"Expected 10 author accounts; found {len(authors)}."
            )

        # Verify the configured admin email matches the database.
        if admins[0].email.lower() != admin_email.lower():
            raise RuntimeError(
                "Configured admin email does not match "
                "the production admin account."
            )

        # Update password hashes only.
        admins[0].password_hash = hash_password(admin_password)

        for author in authors:
            author.password_hash = hash_password(author_password)

        db.commit()

        print("PASSWORD SYNCHRONIZATION COMPLETED SUCCESSFULLY")
        print("Admin password hashes updated: 1")
        print("Author password hashes updated: 10")
        print("Books, tickets and other records were not modified.")

    except Exception:
        db.rollback()
        print("PASSWORD SYNCHRONIZATION FAILED. Changes rolled back.")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    sync_passwords()
