from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Author, Book
from app.security import hash_password
from app.config import settings

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/seed")
def seed_database(db: Session = Depends(get_db)):
    """Seed the database with admin user and sample data"""
    try:
        # Check if admin already exists
        existing_admin = db.query(Author).filter(
            Author.email == settings.admin_email
        ).first()
        
        if existing_admin:
            return {"message": "Database already seeded"}
        
        # Create admin user
        admin = Author(
            id="ADMIN001",
            name="Admin User",
            email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
            role="admin"
        )
        db.add(admin)
        
        # Create sample author
        author = Author(
            id="AUTH001",
            name="Jane Doe",
            email="jane.doe@example.com",
            password_hash=hash_password(settings.seeded_author_password),
            role="author",
            city="New York"
        )
        db.add(author)
        
        # Create sample book
        book = Book(
            id="BK001",
            author_id="AUTH001",
            title="The Art of Writing",
            isbn="978-0-123456-78-9",
            genre="Fiction",
            status="Published",
            mrp=299.99,
            author_royalty_per_copy=80.0,
            total_copies_sold=150,
            total_royalty_earned=12000.0,
            royalty_paid=8000.0,
            royalty_pending=4000.0,
            print_partner="PrintPartner Inc",
            available_on_json='["Amazon", "Flipkart"]'
        )
        db.add(book)
        
        db.commit()
        
        return {
            "message": "Database seeded successfully",
            "admin_email": settings.admin_email,
            "admin_password": settings.admin_password
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
