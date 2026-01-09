"""
Vehicle routes for LocaTrack API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime

from config import db
from models import User, UserRole, Vehicle, VehicleCreate
from utils.auth import get_current_user, require_role, get_tenant_id

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("", response_model=List[Vehicle])
async def get_vehicles(current_user: User = Depends(get_current_user)):
    """Get vehicles for the current tenant"""
    tenant_id = get_tenant_id(current_user)
    if not tenant_id:
        return []
    
    vehicles = await db.vehicles.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    for v in vehicles:
        for date_field in ['created_at', 'insurance_expiry']:
            if v.get(date_field) and isinstance(v[date_field], str):
                v[date_field] = datetime.fromisoformat(v[date_field])
    return vehicles


@router.post("", response_model=Vehicle)
async def create_vehicle(
    vehicle_create: VehicleCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    """Create a vehicle for the current tenant"""
    tenant_id = get_tenant_id(current_user)
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    vehicle_obj = Vehicle(tenant_id=tenant_id, **vehicle_create.model_dump())
    doc = vehicle_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('insurance_expiry'):
        doc['insurance_expiry'] = doc['insurance_expiry'].isoformat()
    
    await db.vehicles.insert_one(doc)
    return vehicle_obj


@router.put("/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(
    vehicle_id: str,
    vehicle_update: VehicleCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    """Update a vehicle belonging to the current tenant"""
    tenant_id = get_tenant_id(current_user)
    update_data = vehicle_update.model_dump()
    if update_data.get('insurance_expiry'):
        update_data['insurance_expiry'] = update_data['insurance_expiry'].isoformat()
    
    result = await db.vehicles.update_one(
        {"id": vehicle_id, "tenant_id": tenant_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    vehicle_doc = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    for date_field in ['created_at', 'insurance_expiry']:
        if vehicle_doc.get(date_field) and isinstance(vehicle_doc[date_field], str):
            vehicle_doc[date_field] = datetime.fromisoformat(vehicle_doc[date_field])
    
    return Vehicle(**vehicle_doc)


@router.delete("/{vehicle_id}")
async def delete_vehicle(
    vehicle_id: str,
    current_user: User = Depends(require_role([UserRole.LOCATEUR]))
):
    """Delete a vehicle (Locateur only)"""
    tenant_id = get_tenant_id(current_user)
    result = await db.vehicles.delete_one({"id": vehicle_id, "tenant_id": tenant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Vehicle deleted successfully"}
