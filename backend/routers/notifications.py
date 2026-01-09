"""
Notifications routes for LocaTrack API
"""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone

from config import db
from models import User
from utils.auth import get_current_user, get_tenant_id

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    current_user: User = Depends(get_current_user)
):
    """Get notifications for expiring documents (insurance, technical control)"""
    tenant_id = get_tenant_id(current_user)
    if not tenant_id:
        return []
    
    notifications = []
    now = datetime.now(timezone.utc)
    warning_days = 30
    
    vehicles = await db.vehicles.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    
    for vehicle in vehicles:
        vehicle_name = f"{vehicle.get('brand', '')} {vehicle.get('model', '')} ({vehicle.get('plate_number', '')})"
        
        # Check insurance expiry
        if vehicle.get('insurance_expiry'):
            expiry = vehicle['insurance_expiry']
            if isinstance(expiry, str):
                expiry = datetime.fromisoformat(expiry.replace('Z', '+00:00'))
            days_left = (expiry - now).days
            
            if days_left < 0:
                notifications.append({
                    "id": f"ins_{vehicle['id']}",
                    "type": "danger",
                    "category": "insurance",
                    "title": "Assurance expirée",
                    "message": f"{vehicle_name} - Assurance expirée depuis {abs(days_left)} jours",
                    "vehicle_id": vehicle['id'],
                    "days_left": days_left,
                    "created_at": now.isoformat()
                })
            elif days_left <= warning_days:
                notifications.append({
                    "id": f"ins_{vehicle['id']}",
                    "type": "warning",
                    "category": "insurance",
                    "title": "Assurance expire bientôt",
                    "message": f"{vehicle_name} - Assurance expire dans {days_left} jours",
                    "vehicle_id": vehicle['id'],
                    "days_left": days_left,
                    "created_at": now.isoformat()
                })
        
        # Check technical inspection expiry
        if vehicle.get('technical_inspection_expiry'):
            expiry = vehicle['technical_inspection_expiry']
            if isinstance(expiry, str):
                expiry = datetime.fromisoformat(expiry.replace('Z', '+00:00'))
            days_left = (expiry - now).days
            
            if days_left < 0:
                notifications.append({
                    "id": f"tech_{vehicle['id']}",
                    "type": "danger",
                    "category": "technical_control",
                    "title": "Contrôle technique expiré",
                    "message": f"{vehicle_name} - Contrôle technique expiré depuis {abs(days_left)} jours",
                    "vehicle_id": vehicle['id'],
                    "days_left": days_left,
                    "created_at": now.isoformat()
                })
            elif days_left <= warning_days:
                notifications.append({
                    "id": f"tech_{vehicle['id']}",
                    "type": "warning",
                    "category": "technical_control",
                    "title": "Contrôle technique expire bientôt",
                    "message": f"{vehicle_name} - Contrôle technique expire dans {days_left} jours",
                    "vehicle_id": vehicle['id'],
                    "days_left": days_left,
                    "created_at": now.isoformat()
                })
    
    notifications.sort(key=lambda x: (0 if x['type'] == 'danger' else 1, x.get('days_left', 999)))
    
    return notifications
