from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from app.database import get_db
from app.security import get_current_user, require_admin
from app.support_ai import classify_ticket
from app.models import Author, Book, Ticket, TicketMessage, InternalNote
from app.schemas import (
    TicketCreate,
    TicketResponse,
    TicketMessageCreate,
    TicketMessageResponse,
    TicketStatusUpdate,
    InternalNoteCreate,
    InternalNoteResponse,
)
router = APIRouter(prefix="/api/tickets", tags=["Support Tickets"])


@router.post("/", response_model=TicketResponse, status_code=201)
def create_ticket(
    request: TicketCreate,
    user: Author = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify that the selected book belongs to this author.
    if request.book_id:
        book = db.query(Book).filter(
            Book.id == request.book_id,
            Book.author_id == user.id
        ).first()

        if not book:
            raise HTTPException(
                status_code=404,
                detail="Book not found or does not belong to you"
            )

    # Save the ticket before calling Gemini.
    ticket = Ticket(
        author_id=user.id,
        book_id=request.book_id,
        subject=request.subject,
        description=request.description,
        category="General Inquiry",
        priority="Medium",
        status="Open",
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # AI classification and response drafting.
    ai_result = classify_ticket(
        request.subject,
        request.description
    )

    ticket.category = ai_result["category"]
    ticket.priority = ai_result["priority"]
    ticket.ai_reasoning = ai_result["reasoning"]
    ticket.ai_draft = ai_result["draft"]

    db.commit()
    db.refresh(ticket)

    return ticket

# Admin: Dashboard statistics
@router.get("/admin/dashboard")
def get_admin_dashboard(
    admin: Author = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_tickets = db.query(func.count(Ticket.id)).scalar() or 0

    status_counts = (
        db.query(Ticket.status, func.count(Ticket.id))
        .group_by(Ticket.status)
        .all()
    )

    priority_counts = (
        db.query(Ticket.priority, func.count(Ticket.id))
        .group_by(Ticket.priority)
        .all()
    )

    category_counts = (
        db.query(Ticket.category, func.count(Ticket.id))
        .group_by(Ticket.category)
        .all()
    )

    return {
        "total_tickets": total_tickets,
        "status_counts": {
            status: count for status, count in status_counts
        },
        "priority_counts": {
            priority: count for priority, count in priority_counts
        },
        "category_counts": {
            category: count for category, count in category_counts
        },
    }
    
# List tickets with optional filters and pagination
@router.get("/", response_model=list[TicketResponse])
def list_tickets(
    status: str | None = None,
    category: str | None = None,
    priority: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    user: Author = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Ticket)

    # Authors can only see their own tickets.
    # Admins can see all tickets.
    if user.role != "admin":
        query = query.filter(
            Ticket.author_id == user.id
        )

    # Apply optional filters.
    if status:
        query = query.filter(Ticket.status == status)

    if category:
        query = query.filter(Ticket.category == category)

    if priority:
        query = query.filter(Ticket.priority == priority)

    return (
        query
        .order_by(Ticket.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# Retrieve individual ticket details
@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    user: Author = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    # Prevent authors from accessing other authors' tickets.
    if user.role != "admin" and ticket.author_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access this ticket",
        )

    return ticket

def get_accessible_ticket(
    ticket_id: int,
    user: Author,
    db: Session
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    if user.role != "admin" and ticket.author_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access this ticket"
        )

    return ticket

# Retrieve conversation messages for a ticket
@router.get(
    "/{ticket_id}/messages",
    response_model=list[TicketMessageResponse]
)
def get_ticket_messages(
    ticket_id: int,
    user: Author = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = get_accessible_ticket(ticket_id, user, db)

    messages = db.query(TicketMessage).filter(
        TicketMessage.ticket_id == ticket.id
    ).order_by(
        TicketMessage.created_at.asc()
    ).all()

    return messages

# Send a message in a ticket conversation
@router.post(
    "/{ticket_id}/messages",
    response_model=TicketMessageResponse,
    status_code=201
)
def send_ticket_message(
    ticket_id: int,
    request: TicketMessageCreate,
    user: Author = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = get_accessible_ticket(ticket_id, user, db)

    message = TicketMessage(
        ticket_id=ticket.id,
        sender_id=user.id,
        body=request.body.strip()
    )

    if not message.body:
        raise HTTPException(
            status_code=422,
            detail="Message cannot be empty"
        )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message

# Admin: Update ticket status
@router.patch("/{ticket_id}/status", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    request: TicketStatusUpdate,
    admin: Author = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = get_accessible_ticket(ticket_id, admin, db)

    allowed_statuses = {
        "Open",
        "In Progress",
        "Resolved",
        "Closed",
    }

    if request.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed values: {sorted(allowed_statuses)}",
        )

    ticket.status = request.status

    db.commit()
    db.refresh(ticket)

    return ticket
# Admin: Update ticket category
@router.patch("/{ticket_id}/category", response_model=TicketResponse)
def update_ticket_category(
    ticket_id: int,
    category: str = Body(..., embed=True),
    admin: Author = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = get_accessible_ticket(ticket_id, admin, db)

    allowed_categories = {
        "Royalty & Payments",
        "ISBN & Metadata Issues",
        "Printing & Quality",
        "Distribution & Availability",
        "Book Status & Production Updates",
        "General Inquiry",
    }

    if category not in allowed_categories:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Allowed values: {sorted(allowed_categories)}",
        )

    ticket.category = category

    db.commit()
    db.refresh(ticket)

    return ticket


# Admin: Update ticket priority
@router.patch("/{ticket_id}/priority", response_model=TicketResponse)
def update_ticket_priority(
    ticket_id: int,
    priority: str = Body(..., embed=True),
    admin: Author = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = get_accessible_ticket(ticket_id, admin, db)

    allowed_priorities = {
        "Critical",
        "High",
        "Medium",
        "Low",
    }

    if priority not in allowed_priorities:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid priority. Allowed values: {sorted(allowed_priorities)}",
        )

    ticket.priority = priority

    db.commit()
    db.refresh(ticket)

    return ticket
# Admin: Assign ticket to the currently logged-in admin
@router.patch("/{ticket_id}/assign-to-me", response_model=TicketResponse)
def assign_ticket_to_me(
    ticket_id: int,
    admin: Author = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = get_accessible_ticket(ticket_id, admin, db)

    ticket.assigned_admin_id = admin.id

    db.commit()
    db.refresh(ticket)

    return ticket
# Admin: Add an internal note to a ticket
@router.post(
    "/{ticket_id}/notes",
    response_model=InternalNoteResponse,
    status_code=201,
)
def create_internal_note(
    ticket_id: int,
    request: InternalNoteCreate,
    admin: Author = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = get_accessible_ticket(ticket_id, admin, db)

    note = InternalNote(
        ticket_id=ticket.id,
        admin_id=admin.id,
        body=request.body.strip(),
    )

    if not note.body:
        raise HTTPException(
            status_code=422,
            detail="Internal note cannot be empty",
        )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note

# Admin: View internal notes for a ticket
@router.get(
    "/{ticket_id}/notes",
    response_model=list[InternalNoteResponse],
)
def get_internal_notes(
    ticket_id: int,
    admin: Author = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = get_accessible_ticket(ticket_id, admin, db)

    notes = db.query(InternalNote).filter(
        InternalNote.ticket_id == ticket.id
    ).order_by(
        InternalNote.created_at.asc()
    ).all()

    return notes