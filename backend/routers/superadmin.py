"""
SuperAdmin routes for LocaTrack API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone, timedelta

from config import db
from models import User, UserRole, UserUpdate
from utils.auth import require_role

router = APIRouter(prefix="/admin", tags=["SuperAdmin"])


@router.get("/locateurs")
async def get_all_locateurs(
    current_user: User = Depends(require_role([UserRole.SUPERADMIN]))
):
    """Get all registered locateurs with their stats"""
    locateurs = await db.users.find(
        {"role": UserRole.LOCATEUR},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    for loc in locateurs:
        if loc.get('created_at') and isinstance(loc['created_at'], str):
            loc['created_at'] = datetime.fromisoformat(loc['created_at'])
        
        loc['vehicle_count'] = await db.vehicles.count_documents({"tenant_id": loc['id']})
        loc['employee_count'] = await db.users.count_documents({"tenant_id": loc['id'], "role": UserRole.EMPLOYEE})
        loc['contract_count'] = await db.contracts.count_documents({"tenant_id": loc['id']})
    
    return locateurs


@router.get("/users")
async def get_users(
    current_user: User = Depends(require_role([UserRole.SUPERADMIN]))
):
    """Get all registered users with passwords (SuperAdmin only)"""
    # Include password_plain for superadmin
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for u in users:
        if u.get('created_at') and isinstance(u['created_at'], str):
            u['created_at'] = datetime.fromisoformat(u['created_at'])
    return users


@router.get("/all-users")
async def get_all_users_detailed(
    current_user: User = Depends(require_role([UserRole.SUPERADMIN]))
):
    """Get all users with full details including passwords (SuperAdmin only)"""
    # Include password_plain for superadmin view
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    for user in users:
        for date_field in ['created_at', 'subscription_start', 'subscription_end', 'last_login']:
            if user.get(date_field) and isinstance(user[date_field], str):
                user[date_field] = datetime.fromisoformat(user[date_field])
        
        if user.get('subscription_end'):
            sub_end = user['subscription_end']
            if isinstance(sub_end, str):
                sub_end = datetime.fromisoformat(sub_end)
            days_remaining = (sub_end - datetime.now(timezone.utc)).days
            user['days_remaining'] = max(0, days_remaining)
            user['is_expired'] = days_remaining < 0
        else:
            user['days_remaining'] = None
            user['is_expired'] = False
        
        if user.get('role') == UserRole.LOCATEUR:
            user['employee_count'] = await db.users.count_documents({"tenant_id": user['id'], "role": UserRole.EMPLOYEE})
            user['vehicle_count'] = await db.vehicles.count_documents({"tenant_id": user['id']})
    
    return users


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(require_role([UserRole.SUPERADMIN]))
):
    """Update a user (SuperAdmin only)"""
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    if user_id == current_user.id and 'role' in update_data:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_role([UserRole.SUPERADMIN]))
):
    """Delete a user (SuperAdmin only)"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user_to_delete = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_to_delete.get('role') == UserRole.LOCATEUR:
        await db.vehicles.delete_many({"tenant_id": user_id})
        await db.contracts.delete_many({"tenant_id": user_id})
        await db.reservations.delete_many({"tenant_id": user_id})
        await db.payments.delete_many({"tenant_id": user_id})
        await db.maintenance.delete_many({"tenant_id": user_id})
        await db.infractions.delete_many({"tenant_id": user_id})
        await db.clients.delete_many({"tenant_id": user_id})
        await db.users.delete_many({"tenant_id": user_id})
    
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.conversations.delete_many({"participants": user_id})
    await db.messages.delete_many({"sender_id": user_id})
    
    return {"message": "User deleted successfully"}


@router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    reason: Optional[str] = None,
    current_user: User = Depends(require_role([UserRole.SUPERADMIN]))
):
    """Suspend a user account (SuperAdmin only)"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot suspend your own account")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_suspended": True, "suspension_reason": reason or "Suspendu par l'administrateur"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User suspended successfully"}


@router.post("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    current_user: User = Depends(require_role([UserRole.SUPERADMIN]))
):
    """Activate a suspended user account (SuperAdmin only)"""
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_suspended": False, "suspension_reason": None}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User activated successfully"}


@router.post("/users/{user_id}/subscription")
async def update_subscription(
    user_id: str,
    subscription_type: str,
    current_user: User = Depends(require_role([UserRole.SUPERADMIN]))
):
    """Update user subscription (SuperAdmin only)"""
    now = datetime.now(timezone.utc)
    
    if subscription_type == "trial":
        end_date = now + timedelta(days=15)
    elif subscription_type == "annual":
        end_date = now + timedelta(days=365)
    elif subscription_type == "lifetime":
        end_date = now + timedelta(days=36500)
    else:
        raise HTTPException(status_code=400, detail="Invalid subscription type")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "subscription_type": subscription_type,
            "subscription_start": now.isoformat(),
            "subscription_end": end_date.isoformat(),
            "is_suspended": False
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"Subscription updated to {subscription_type}", "expires": end_date.isoformat()}


@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(require_role([UserRole.SUPERADMIN]))
):
    """Get platform statistics (SuperAdmin only)"""
    total_locateurs = await db.users.count_documents({"role": UserRole.LOCATEUR})
    total_employees = await db.users.count_documents({"role": UserRole.EMPLOYEE})
    superadmins = await db.users.count_documents({"role": UserRole.SUPERADMIN})
    total_clients = await db.clients.count_documents({})
    
    total_vehicles = await db.vehicles.count_documents({})
    available_vehicles = await db.vehicles.count_documents({"status": "available"})
    rented_vehicles = await db.vehicles.count_documents({"status": "rented"})
    total_contracts = await db.contracts.count_documents({})
    active_contracts = await db.contracts.count_documents({"status": "active"})
    total_reservations = await db.reservations.count_documents({})
    total_payments = await db.payments.count_documents({})
    
    payments = await db.payments.find({"status": "completed"}, {"_id": 0, "amount": 1}).to_list(10000)
    total_revenue = sum(p.get('amount', 0) for p in payments)
    
    maintenances = await db.maintenance.find({"status": "completed"}, {"_id": 0, "cost": 1}).to_list(10000)
    total_maintenance_cost = sum(m.get('cost', 0) for m in maintenances)
    
    pending_infractions = await db.infractions.count_documents({"status": "pending"})
    
    return {
        "total_locateurs": total_locateurs,
        "total_employees": total_employees,
        "superadmins": superadmins,
        "total_clients_platform": total_clients,
        "total_vehicles_platform": total_vehicles,
        "available_vehicles_platform": available_vehicles,
        "rented_vehicles_platform": rented_vehicles,
        "total_contracts_platform": total_contracts,
        "active_contracts_platform": active_contracts,
        "total_reservations_platform": total_reservations,
        "total_payments_platform": total_payments,
        "total_revenue_platform": total_revenue,
        "total_maintenance_cost_platform": total_maintenance_cost,
        "pending_infractions_platform": pending_infractions
    }
