"""
Maintenance routes for LocaTrack API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone, timedelta

from config import db
from models import User, UserRole, Maintenance, MaintenanceCreate
from utils.auth import require_role, get_tenant_id

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


@router.get("", response_model=List[Maintenance])
async def get_maintenance(
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    maintenances = await db.maintenance.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    for m in maintenances:
        for date_field in ['created_at', 'scheduled_date', 'completed_date']:
            if m.get(date_field) and isinstance(m[date_field], str):
                m[date_field] = datetime.fromisoformat(m[date_field])
    return maintenances


@router.post("", response_model=Maintenance)
async def create_maintenance(
    maintenance_create: MaintenanceCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    maintenance_data = maintenance_create.model_dump()
    maintenance_data['tenant_id'] = tenant_id
    maintenance_obj = Maintenance(**maintenance_data)
    doc = maintenance_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['scheduled_date'] = doc['scheduled_date'].isoformat()
    if doc.get('completed_date'):
        doc['completed_date'] = doc['completed_date'].isoformat()
    
    await db.maintenance.insert_one(doc)
    
    await db.vehicles.update_one(
        {"id": maintenance_create.vehicle_id, "tenant_id": tenant_id},
        {"$set": {"status": "maintenance"}}
    )
    
    return maintenance_obj


@router.get("/alerts")
async def get_maintenance_alerts(
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    today = datetime.now(timezone.utc)
    week_later = today + timedelta(days=7)
    
    upcoming = await db.maintenance.find(
        {
            "tenant_id": tenant_id,
            "status": "scheduled",
            "scheduled_date": {
                "$gte": today.isoformat(),
                "$lte": week_later.isoformat()
            }
        },
        {"_id": 0}
    ).to_list(100)
    
    return {"alerts": upcoming, "count": len(upcoming)}


@router.put("/{maintenance_id}")
async def update_maintenance(
    maintenance_id: str,
    update_data: dict,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    result = await db.maintenance.update_one(
        {"id": maintenance_id, "tenant_id": tenant_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Maintenance not found")
    return {"message": "Maintenance updated"}
