"""
Settings routes for LocaTrack API (GPS configuration)
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from config import db
from models import User, UserRole
from utils.auth import get_current_user, require_role

router = APIRouter(prefix="/settings", tags=["Settings"])


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
    
    locateur = await db.users.find_one({"id": locateur_id}, {"_id": 0, "gps_api_key": 1, "gps_api_url": 1})
    if not locateur:
        raise HTTPException(status_code=404, detail="Locateur not found")
    
    return {
        "gps_api_key": locateur.get("gps_api_key", ""),
        "gps_api_url": locateur.get("gps_api_url", "https://tracking.gps-14.net/api/api.php"),
        "is_configured": bool(locateur.get("gps_api_key"))
    }


@router.put("/gps")
async def update_gps_settings(
    gps_api_key: str,
    gps_api_url: Optional[str] = "https://tracking.gps-14.net/api/api.php",
    current_user: User = Depends(require_role([UserRole.LOCATEUR]))
):
    """Update GPS API settings for the locateur"""
    result = await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "gps_api_key": gps_api_key,
            "gps_api_url": gps_api_url
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "GPS settings updated successfully"}
