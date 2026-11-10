
from datetime import datetime, timezone

from sqlalchemy import (
    String,
    Integer,
    Float,
    Date,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Author(Base):
    __tablename__ = "authors"

    id: Mapped[str] = mapped_column(
        String(32), primary_key=True
    )
    name: Mapped[str] = mapped_column(
        String(160), nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    phone: Mapped[str | None] = mapped_column(String(40))
    city: Mapped[str | None] = mapped_column(String(100))
    joined_date: Mapped[Date | None] = mapped_column(Date)

    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    role: Mapped[str] = mapped_column(
        String(20), default="author", nullable=False
    )

    books: Mapped[list["Book"]] = relationship(
        back_populates="author",
        cascade="all, delete-orphan",
    )

    tickets: Mapped[list["Ticket"]] = relationship(
        back_populates="author",
        cascade="all, delete-orphan",
        foreign_keys="Ticket.author_id",
    )


class Book(Base):
    __tablename__ = "books"

    id: Mapped[str] = mapped_column(
        String(32), primary_key=True
    )
    author_id: Mapped[str] = mapped_column(
        ForeignKey("authors.id"), index=True
    )

    title: Mapped[str] = mapped_column(
        String(300), nullable=False
    )
    isbn: Mapped[str | None] = mapped_column(String(80))
    genre: Mapped[str | None] = mapped_column(String(160))
    publication_date: Mapped[Date | None] = mapped_column(Date)

    status: Mapped[str] = mapped_column(
        String(100), nullable=False
    )

    mrp: Mapped[float | None] = mapped_column(Float)
    author_royalty_per_copy: Mapped[float | None] = mapped_column(Float)

    total_copies_sold: Mapped[int] = mapped_column(
        Integer, default=0
    )
    total_royalty_earned: Mapped[float] = mapped_column(
        Float, default=0
    )
    royalty_paid: Mapped[float] = mapped_column(
        Float, default=0
    )
    royalty_pending: Mapped[float] = mapped_column(
        Float, default=0
    )

    last_royalty_payout_date: Mapped[Date | None] = mapped_column(Date)
    print_partner: Mapped[str | None] = mapped_column(String(100))

    available_on_json: Mapped[str] = mapped_column(
        Text, default="[]"
    )

    author: Mapped["Author"] = relationship(
        back_populates="books"
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    author_id: Mapped[str] = mapped_column(
        ForeignKey("authors.id"), index=True
    )

    book_id: Mapped[str | None] = mapped_column(
        ForeignKey("books.id"), nullable=True
    )

    subject: Mapped[str] = mapped_column(
        String(250), nullable=False
    )
    description: Mapped[str] = mapped_column(
        Text, nullable=False
    )

    category: Mapped[str] = mapped_column(
        String(80), default="General Inquiry"
    )
    priority: Mapped[str] = mapped_column(
        String(20), default="Medium"
    )
    status: Mapped[str] = mapped_column(
        String(20), default="Open", index=True
    )

    ai_reasoning: Mapped[str | None] = mapped_column(Text)
    ai_draft: Mapped[str | None] = mapped_column(Text)

    assigned_admin_id: Mapped[str | None] = mapped_column(
        ForeignKey("authors.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )

    author: Mapped["Author"] = relationship(
        back_populates="tickets",
        foreign_keys=[author_id],
    )

    messages: Mapped[list["TicketMessage"]] = relationship(
        back_populates="ticket",
        cascade="all, delete-orphan",
    )

    notes: Mapped[list["InternalNote"]] = relationship(
        back_populates="ticket",
        cascade="all, delete-orphan",
    )


class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id"), index=True
    )
    sender_id: Mapped[str] = mapped_column(
        ForeignKey("authors.id")
    )

    body: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )

    ticket: Mapped["Ticket"] = relationship(
        back_populates="messages"
    )


class InternalNote(Base):
    __tablename__ = "internal_notes"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id"), index=True
    )
    admin_id: Mapped[str] = mapped_column(
        ForeignKey("authors.id")
    )

    body: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )

    ticket: Mapped["Ticket"] = relationship(
        back_populates="notes"
    )
