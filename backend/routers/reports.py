"""
Reports routes for LocaTrack API
"""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta

from config import db
from models import User, UserRole
from utils.auth import require_role, get_tenant_id

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    total_vehicles = await db.vehicles.count_documents({"tenant_id": tenant_id})
    available_vehicles = await db.vehicles.count_documents({"tenant_id": tenant_id, "status": "available"})
    rented_vehicles = await db.vehicles.count_documents({"tenant_id": tenant_id, "status": "rented"})
    active_contracts = await db.contracts.count_documents({"tenant_id": tenant_id, "status": "active"})
    
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_payments = await db.payments.find(
        {"tenant_id": tenant_id, "status": "completed", "payment_date": {"$gte": thirty_days_ago}},
        {"_id": 0}
    ).to_list(1000)
    
    total_revenue = sum(p['amount'] for p in recent_payments)
    pending_infractions = await db.infractions.count_documents({"tenant_id": tenant_id, "status": "pending"})
    upcoming_maintenance = await db.maintenance.count_documents({"tenant_id": tenant_id, "status": "scheduled"})
    
    if current_user.role == UserRole.LOCATEUR:
        total_employees = await db.users.count_documents({"tenant_id": current_user.id, "role": UserRole.EMPLOYEE})
    else:
        total_employees = 0
    
    total_clients = await db.clients.count_documents({"tenant_id": tenant_id})
    
    return {
        "total_vehicles": total_vehicles,
        "available_vehicles": available_vehicles,
        "rented_vehicles": rented_vehicles,
        "total_employees": total_employees,
        "total_clients": total_clients,
        "active_contracts": active_contracts,
        "total_revenue_30d": total_revenue,
        "pending_infractions": pending_infractions,
        "upcoming_maintenance": upcoming_maintenance
    }


@router.get("/fleet")
async def get_fleet_report(
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    vehicles = await db.vehicles.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    
    status_breakdown = {}
    for v in vehicles:
        status = v.get('status', 'unknown')
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
    
    type_breakdown = {}
    for v in vehicles:
        vtype = v.get('type', 'unknown')
        type_breakdown[vtype] = type_breakdown.get(vtype, 0) + 1
    
    return {
        "total_vehicles": len(vehicles),
        "status_breakdown": status_breakdown,
        "type_breakdown": type_breakdown
    }


@router.get("/financial")
async def get_financial_report(
    current_user: User = Depends(require_role([UserRole.LOCATEUR]))
):
    tenant_id = get_tenant_id(current_user)
    
    payments = await db.payments.find({"tenant_id": tenant_id, "status": "completed"}, {"_id": 0}).to_list(10000)
    total_revenue = sum(p['amount'] for p in payments)
    
    maintenances = await db.maintenance.find({"tenant_id": tenant_id, "status": "completed"}, {"_id": 0}).to_list(10000)
    total_maintenance_cost = sum(m['cost'] for m in maintenances)
    
    monthly_revenue = {}
    for p in payments:
        if p.get('payment_date'):
            date = datetime.fromisoformat(p['payment_date']) if isinstance(p['payment_date'], str) else p['payment_date']
            month_key = date.strftime('%Y-%m')
            monthly_revenue[month_key] = monthly_revenue.get(month_key, 0) + p['amount']
    
    return {
        "total_revenue": total_revenue,
        "total_maintenance_cost": total_maintenance_cost,
        "net_profit": total_revenue - total_maintenance_cost,
        "monthly_revenue": monthly_revenue
    }
