"""
Settings routes for LocaTrack API (GPS configuration)
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel

from config import db
from models import User, UserRole
from utils.auth import get_current_user, require_role

router = APIRouter(prefix="/settings", tags=["Settings"])


class GPSSettingsUpdate(BaseModel):
    provider: str  # 'gps14' or 'itrack'
    # GPS-14 settings
    gps_api_key: Optional[str] = None
    gps_api_url: Optional[str] = "https://tracking.gps-14.net/api/api.php"
    # iTrack settings
    gps_account: Optional[str] = None
    gps_password: Optional[str] = None


@router.get("/gps")
async def get_gps_settings(
    current_user: User = Depends(get_current_user)
):
    """Get GPS API settings for the current locateur"""
    if current_user.role == UserRole.LOCATEUR:
        locateur_id = current_user.id
    elif current_user.role == UserRole.EMPLOYEE:
        locateur_id = current_user.tenant_id
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    locateur = await db.users.find_one(
        {"id": locateur_id}, 
        {"_id": 0, "gps_provider": 1, "gps_api_key": 1, "gps_api_url": 1, "gps_account": 1, "gps_password": 1}
    )
    if not locateur:
        raise HTTPException(status_code=404, detail="Locateur not found")
    
    provider = locateur.get("gps_provider", "gps14")
    
    return {
        "provider": provider,
        "gps_api_key": locateur.get("gps_api_key", ""),
        "gps_api_url": locateur.get("gps_api_url", "https://tracking.gps-14.net/api/api.php"),
        "gps_account": locateur.get("gps_account", ""),
        "gps_password": locateur.get("gps_password", ""),
        "is_configured": bool(locateur.get("gps_api_key") or locateur.get("gps_account"))
    }


@router.put("/gps")
async def update_gps_settings(
    settings: GPSSettingsUpdate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR]))
):
    """Update GPS API settings for the locateur"""
    update_data = {
        "gps_provider": settings.provider,
        "gps_api_url": settings.gps_api_url
    }
    
    if settings.provider == "gps14":
        update_data["gps_api_key"] = settings.gps_api_key
    elif settings.provider == "itrack":
        update_data["gps_account"] = settings.gps_account
        update_data["gps_password"] = settings.gps_password
    
    result = await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "GPS settings updated successfully", "provider": settings.provider}
