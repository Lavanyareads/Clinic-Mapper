"""
Clinic-Cluster Mapper - FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api.routes import router
from app.database import init_db
from app.config import settings

app = FastAPI(
    title="Clinic-Cluster Mapper API",
    description="AI-Powered Healthcare Accessibility & Telemedicine Hub Optimization",
    version="1.0.0",
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(router)


@app.on_event("startup")
def on_startup():
    """Initialize database and required directories on startup."""
    init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)


@app.get("/")
def read_root():
    return {
        "name": "Clinic-Cluster Mapper API",
        "version": "1.0.0",
        "description": "AI-Powered Healthcare Accessibility & Telemedicine Hub Optimization",
        "docs": "/docs",
        "disclaimer": "Academic Decision-Support Prototype - Not for clinical use",
    }
