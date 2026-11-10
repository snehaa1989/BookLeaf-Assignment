
import os
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is missing."
    )

if not DATABASE_URL.startswith("postgresql"):
    raise RuntimeError(
        "Production application requires PostgreSQL."
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)
# Temporary, safe database identity diagnostics.
parsed_url = make_url(DATABASE_URL)

print(
    "BOOKLEAF_DB_CONFIG:",
    {
        "host": parsed_url.host,
        "database": parsed_url.database,
        "username": parsed_url.username,
    }
)

with engine.connect() as connection:
    result = connection.execute(
        text("""
            SELECT
                current_database(),
                current_user,
                inet_server_port()
        """)
    ).one()

    print(
        "BOOKLEAF_DB_RUNTIME:",
        {
            "database": result[0],
            "username": result[1],
            "port": result[2],
        }
    )
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
