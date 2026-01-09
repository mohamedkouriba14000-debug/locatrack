"""
Employee management routes for LocaTrack API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime

from config import db
from models import User, UserRole, EmployeeCreate
from utils.auth import hash_password, require_role

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.post("", response_model=User)
async def create_employee(
    employee_create: EmployeeCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR]))
):
    """Create an employee for the locateur's company"""
    existing_user = await db.users.find_one({"email": employee_create.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_obj = User(
        email=employee_create.email,
        full_name=employee_create.full_name,
        role=UserRole.EMPLOYEE,
        phone=employee_create.phone,
        tenant_id=current_user.id
    )
    
    doc = user_obj.model_dump()
    doc['password'] = hash_password(employee_create.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user_obj


@router.get("", response_model=List[User])
async def get_employees(
    current_user: User = Depends(require_role([UserRole.LOCATEUR]))
):
    """Get all employees for this locateur"""
    employees = await db.users.find(
        {"tenant_id": current_user.id, "role": UserRole.EMPLOYEE},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    for e in employees:
        if isinstance(e.get('created_at'), str):
            e['created_at'] = datetime.fromisoformat(e['created_at'])
    
    return employees


@router.put("/{employee_id}")
async def update_employee(
    employee_id: str,
    update_data: dict,
    current_user: User = Depends(require_role([UserRole.LOCATEUR]))
):
    """Update an employee"""
    result = await db.users.update_one(
        {"id": employee_id, "tenant_id": current_user.id},
        {"$set": {k: v for k, v in update_data.items() if k not in ['password', 'role', 'tenant_id']}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee updated"}


@router.delete("/{employee_id}")
async def delete_employee(
    employee_id: str,
    current_user: User = Depends(require_role([UserRole.LOCATEUR]))
):
    """Delete an employee"""
    result = await db.users.delete_one({"id": employee_id, "tenant_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted"}
