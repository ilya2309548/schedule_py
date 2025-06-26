from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api import auth, schedule, assignments, attendance, groups
from app.database import postgres
from app.database import mongodb

# Create FastAPI application
app = FastAPI(
    title="University App API",
    description="API for university students and teachers",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://147.45.219.199", "http://147.45.219.199:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(schedule.router, prefix="/api", tags=["Schedule"])
app.include_router(assignments.router, prefix="/api", tags=["Assignments"])
app.include_router(attendance.router, prefix="/api", tags=["Attendance"])
app.include_router(groups.router, prefix="/api", tags=["Groups"])


@app.on_event("startup")
async def startup_db_client():
    """Initialize database connections on startup."""
    await postgres.connect_to_postgres()
    await mongodb.connect_to_mongodb()


@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connections on shutdown."""
    await postgres.close_postgres_connection()
    await mongodb.close_mongodb_connection()


@app.get("/")
async def root():
    """Root endpoint of the API."""
    return {
        "message": "Welcome to University App API",
        "docs": "/docs",
        "redoc": "/redoc",
    }


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
