"""
Reservation routes for LocaTrack API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime

from config import db
from models import User, UserRole, Reservation, ReservationCreate
from utils.auth import get_current_user, require_role, get_tenant_id

router = APIRouter(prefix="/reservations", tags=["Reservations"])


@router.get("", response_model=List[Reservation])
async def get_reservations(current_user: User = Depends(get_current_user)):
    tenant_id = get_tenant_id(current_user)
    if not tenant_id:
        return []
    
    reservations = await db.reservations.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    for r in reservations:
        for date_field in ['created_at', 'start_date', 'end_date']:
            if r.get(date_field) and isinstance(r[date_field], str):
                r[date_field] = datetime.fromisoformat(r[date_field])
    return reservations


@router.post("", response_model=Reservation)
async def create_reservation(
    reservation_create: ReservationCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    
    vehicle = await db.vehicles.find_one({"id": reservation_create.vehicle_id, "tenant_id": tenant_id}, {"_id": 0})
    if not vehicle or vehicle['status'] != 'available':
        raise HTTPException(status_code=400, detail="Vehicle not available")
    
    reservation_data = reservation_create.model_dump()
    reservation_data['tenant_id'] = tenant_id
    reservation_obj = Reservation(**reservation_data)
    doc = reservation_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['start_date'] = doc['start_date'].isoformat()
    doc['end_date'] = doc['end_date'].isoformat()
    
    await db.reservations.insert_one(doc)
    return reservation_obj


@router.put("/{reservation_id}/status")
async def update_reservation_status(
    reservation_id: str,
    status: str,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    result = await db.reservations.update_one(
        {"id": reservation_id, "tenant_id": tenant_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return {"message": "Reservation status updated"}
