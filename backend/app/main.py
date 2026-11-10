
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.books import router as books_router
from app.routers.tickets import router as tickets_router
from app.database import Base, engine
from app import models
from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router

Base.metadata.create_all(bind=engine)

# Run password synchronization only when explicitly enabled.
if os.getenv(
    "RUN_PASSWORD_SYNC_ON_STARTUP", "false"
).lower() == "true":
    from sync_passwords import sync_passwords

    sync_passwords()

app = FastAPI(
    title="BookLeaf Author Support Portal",
    description="Author and Admin Support Communication API",
    version="1.0.0",
)

# Get allowed origins from environment or use defaults
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:80"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(books_router)
app.include_router(tickets_router)
@app.get("/")
def root():
    return {
        "message": "BookLeaf Author Support Portal API is running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
