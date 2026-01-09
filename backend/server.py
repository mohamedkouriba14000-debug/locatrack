"""
LocaTrack API - Car Rental Management Platform
Main application entry point (refactored)
"""
from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
import os
import logging

from config import UPLOADS_DIR, client

# Import all routers
from routers import (
    auth_router,
    employees_router,
    settings_router,
    vehicles_router,
    clients_router,
    contracts_router,
    reservations_router,
    payments_router,
    maintenance_router,
    infractions_router,
    reports_router,
    superadmin_router,
    gps_router,
    notifications_router,
    messages_router,
)

# Create the main app
app = FastAPI(
    title="LocaTrack API",
    description="Multi-tenant Car Rental Management Platform",
    version="2.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Include all sub-routers
api_router.include_router(auth_router)
api_router.include_router(employees_router)
api_router.include_router(settings_router)
api_router.include_router(vehicles_router)
api_router.include_router(clients_router)
api_router.include_router(contracts_router)
api_router.include_router(reservations_router)
api_router.include_router(payments_router)
api_router.include_router(maintenance_router)
api_router.include_router(infractions_router)
api_router.include_router(reports_router)
api_router.include_router(superadmin_router)
api_router.include_router(gps_router)
api_router.include_router(notifications_router)
api_router.include_router(messages_router)

# Include main API router
app.include_router(api_router)

# Mount static files for uploads
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@app.get("/")
async def root():
    return {"message": "LocaTrack API v2.0.0", "status": "running"}
