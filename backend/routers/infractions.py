"""
Infraction routes for LocaTrack API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime

from config import db
from models import User, UserRole, Infraction, InfractionCreate
from utils.auth import require_role, get_tenant_id

router = APIRouter(prefix="/infractions", tags=["Infractions"])


@router.get("", response_model=List[Infraction])
async def get_infractions(
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    infractions = await db.infractions.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    for i in infractions:
        for date_field in ['created_at', 'date']:
            if i.get(date_field) and isinstance(i[date_field], str):
                i[date_field] = datetime.fromisoformat(i[date_field])
    return infractions


@router.post("", response_model=Infraction)
async def create_infraction(
    infraction_create: InfractionCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    infraction_data = infraction_create.model_dump()
    infraction_data['tenant_id'] = tenant_id
    infraction_obj = Infraction(**infraction_data)
    doc = infraction_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['date'] = doc['date'].isoformat()
    
    await db.infractions.insert_one(doc)
    return infraction_obj


@router.put("/{infraction_id}")
async def update_infraction(
    infraction_id: str,
    update_data: dict,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    result = await db.infractions.update_one(
        {"id": infraction_id, "tenant_id": tenant_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Infraction not found")
    return {"message": "Infraction updated"}
