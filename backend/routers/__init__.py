"""
API Routers for LocaTrack
"""
from routers.auth import router as auth_router
from routers.employees import router as employees_router
from routers.settings import router as settings_router
from routers.vehicles import router as vehicles_router
from routers.clients import router as clients_router
from routers.contracts import router as contracts_router
from routers.reservations import router as reservations_router
from routers.payments import router as payments_router
from routers.maintenance import router as maintenance_router
from routers.infractions import router as infractions_router
from routers.reports import router as reports_router
from routers.superadmin import router as superadmin_router
from routers.gps import router as gps_router
from routers.notifications import router as notifications_router
from routers.messages import router as messages_router

__all__ = [
    "auth_router",
    "employees_router",
    "settings_router",
    "vehicles_router",
    "clients_router",
    "contracts_router",
    "reservations_router",
    "payments_router",
    "maintenance_router",
    "infractions_router",
    "reports_router",
    "superadmin_router",
    "gps_router",
    "notifications_router",
    "messages_router",
]
