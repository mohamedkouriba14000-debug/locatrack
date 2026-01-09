"""
Payment routes for LocaTrack API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone

from config import db
from models import User, UserRole, Payment, PaymentCreate
from utils.auth import require_role, get_tenant_id

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("", response_model=List[Payment])
async def get_payments(
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    payments = await db.payments.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    for p in payments:
        for date_field in ['created_at', 'payment_date']:
            if p.get(date_field) and isinstance(p[date_field], str):
                p[date_field] = datetime.fromisoformat(p[date_field])
    return payments


@router.post("", response_model=Payment)
async def create_payment(
    payment_create: PaymentCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    payment_data = payment_create.model_dump()
    payment_data['tenant_id'] = tenant_id
    payment_obj = Payment(**payment_data)
    payment_obj.status = "completed"
    payment_obj.payment_date = datetime.now(timezone.utc)
    
    doc = payment_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('payment_date'):
        doc['payment_date'] = doc['payment_date'].isoformat()
    
    await db.payments.insert_one(doc)
    return payment_obj


@router.put("/{payment_id}", response_model=Payment)
async def update_payment(
    payment_id: str,
    payment_update: PaymentCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    existing = await db.payments.find_one({"id": payment_id, "tenant_id": tenant_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    update_data = payment_update.model_dump()
    update_data['payment_date'] = datetime.now(timezone.utc).isoformat()
    
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": update_data}
    )
    
    updated = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    for date_field in ['created_at', 'payment_date']:
        if updated.get(date_field) and isinstance(updated[date_field], str):
            updated[date_field] = datetime.fromisoformat(updated[date_field])
    return Payment(**updated)


@router.delete("/{payment_id}")
async def delete_payment(
    payment_id: str,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    result = await db.payments.delete_one({"id": payment_id, "tenant_id": tenant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Payment deleted successfully"}
