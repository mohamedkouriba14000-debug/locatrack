"""
Contract routes for LocaTrack API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone

from config import db
from models import User, UserRole, Contract, ContractCreate, ContractSign
from utils.auth import get_current_user, require_role, get_tenant_id

router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.get("", response_model=List[Contract])
async def get_contracts(current_user: User = Depends(get_current_user)):
    tenant_id = get_tenant_id(current_user)
    if not tenant_id:
        return []
    
    contracts = await db.contracts.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    for c in contracts:
        for date_field in ['created_at', 'start_date', 'end_date', 'signed_at']:
            if c.get(date_field) and isinstance(c[date_field], str):
                c[date_field] = datetime.fromisoformat(c[date_field])
    return contracts


@router.post("", response_model=Contract)
async def create_contract(
    contract_create: ContractCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    contract_data = contract_create.model_dump()
    contract_data['tenant_id'] = tenant_id
    contract_obj = Contract(**contract_data)
    
    doc = contract_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['start_date'] = doc['start_date'].isoformat()
    doc['end_date'] = doc['end_date'].isoformat()
    if doc.get('signed_at'):
        doc['signed_at'] = doc['signed_at'].isoformat()
    
    await db.contracts.insert_one(doc)
    return contract_obj


@router.get("/{contract_id}")
async def get_contract(
    contract_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a single contract by ID"""
    tenant_id = get_tenant_id(current_user)
    contract = await db.contracts.find_one({"id": contract_id, "tenant_id": tenant_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    for date_field in ['created_at', 'start_date', 'end_date', 'signed_at']:
        if contract.get(date_field) and isinstance(contract[date_field], str):
            contract[date_field] = datetime.fromisoformat(contract[date_field])
    
    return contract


@router.post("/{contract_id}/sign", response_model=Contract)
async def sign_contract(
    contract_id: str,
    signature: ContractSign,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    update_data = {
        "signed": True,
        "signature_data": signature.signature_data,
        "signed_at": datetime.now(timezone.utc).isoformat(),
        "status": "active"
    }
    
    result = await db.contracts.update_one(
        {"id": contract_id, "tenant_id": tenant_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract_doc = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    await db.vehicles.update_one(
        {"id": contract_doc['vehicle_id']},
        {"$set": {"status": "rented"}}
    )
    
    for date_field in ['created_at', 'start_date', 'end_date', 'signed_at']:
        if contract_doc.get(date_field) and isinstance(contract_doc[date_field], str):
            contract_doc[date_field] = datetime.fromisoformat(contract_doc[date_field])
    
    return Contract(**contract_doc)
