
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, ConfigDict, Field


# -------------------------
# Authentication Schemas
# -------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    city: str | None = None

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Book Schemas
# -------------------------

class BookResponse(BaseModel):
    id: str
    author_id: str
    title: str
    isbn: str | None = None
    genre: str | None = None
    publication_date: date | None = None
    status: str
    mrp: float | None = None
    author_royalty_per_copy: float | None = None
    total_copies_sold: int
    total_royalty_earned: float
    royalty_paid: float
    royalty_pending: float
    last_royalty_payout_date: date | None = None
    print_partner: str | None = None
    available_on: list[str]


# -------------------------
# Ticket Schemas
# -------------------------

class TicketCreate(BaseModel):
    book_id: str | None = None
    subject: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)


class TicketResponse(BaseModel):
    id: int
    author_id: str
    book_id: str | None = None
    subject: str
    description: str
    category: str
    priority: str
    status: str
    ai_reasoning: str | None = None
    ai_draft: str | None = None
    created_at: datetime
    updated_at: datetime
    assigned_admin_id: int | None = None
    model_config = ConfigDict(from_attributes=True)


class TicketDetailResponse(TicketResponse):
    messages: list["TicketMessageResponse"] = Field(
        default_factory=list
    )


class TicketStatusUpdate(BaseModel):
    status: str


# -------------------------
# Ticket Conversation Schemas
# -------------------------

class TicketMessageCreate(BaseModel):
    body: str = Field(..., min_length=1)


class TicketMessageResponse(BaseModel):
    id: int
    ticket_id: int
    sender_id: str
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Internal Note Schemas
# -------------------------

class InternalNoteCreate(BaseModel):
    body: str = Field(..., min_length=1)


class InternalNoteResponse(BaseModel):
    id: int
    ticket_id: int
    admin_id: str
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
