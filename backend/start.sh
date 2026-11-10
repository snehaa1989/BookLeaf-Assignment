#!/bin/sh
python -c "from app.database import engine; from app import models; from app.database import Base; Base.metadata.create_all(bind=engine)"
if [ "$RELOAD" = "true" ]; then
    uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --reload
else
    uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
fi
