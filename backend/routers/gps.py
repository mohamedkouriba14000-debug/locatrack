"""
GPS Tracking routes for LocaTrack API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import httpx
import logging

from config import db
from models import User, UserRole
from utils.auth import get_current_user

router = APIRouter(prefix="/gps", tags=["GPS Tracking"])


async def get_locateur_gps_config(current_user: User):
    """Get GPS API configuration for the current user's locateur"""
    if current_user.role == UserRole.LOCATEUR:
        locateur_id = current_user.id
    elif current_user.role == UserRole.EMPLOYEE:
        locateur_id = current_user.tenant_id
    else:
        return None, None
    
    locateur = await db.users.find_one({"id": locateur_id}, {"_id": 0, "gps_api_key": 1, "gps_api_url": 1})
    if not locateur or not locateur.get("gps_api_key"):
        return None, None
    
    return locateur.get("gps_api_key"), locateur.get("gps_api_url", "https://tracking.gps-14.net/api/api.php")


@router.get("/objects")
async def get_gps_objects(
    current_user: User = Depends(get_current_user)
):
    """Get all GPS tracked objects from the external GPS API"""
    gps_api_key, gps_api_url = await get_locateur_gps_config(current_user)
    
    if not gps_api_key:
        raise HTTPException(status_code=400, detail="Clé API GPS non configurée. Veuillez configurer votre clé API GPS dans les paramètres.")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                gps_api_url,
                params={"api": "user", "key": gps_api_key, "cmd": "USER_GET_OBJECTS"}
            )
            response.raise_for_status()
            data = response.json()
            
            objects = []
            for obj in data:
                objects.append({
                    "imei": obj.get("imei"),
                    "name": obj.get("name"),
                    "model": obj.get("model"),
                    "plate_number": obj.get("plate_number"),
                    "lat": float(obj.get("lat", 0)),
                    "lng": float(obj.get("lng", 0)),
                    "altitude": float(obj.get("altitude", 0)),
                    "angle": float(obj.get("angle", 0)),
                    "speed": float(obj.get("speed", 0)),
                    "odometer": float(obj.get("odometer", 0)),
                    "active": obj.get("active") == "true",
                    "loc_valid": obj.get("loc_valid") == "1",
                    "dt_tracker": obj.get("dt_tracker"),
                    "dt_server": obj.get("dt_server"),
                    "dt_last_stop": obj.get("dt_last_stop"),
                    "dt_last_move": obj.get("dt_last_move"),
                    "params": obj.get("params", {}),
                    "device": obj.get("device"),
                    "sim_number": obj.get("sim_number"),
                    "vin": obj.get("vin"),
                    "engine_hours": float(obj.get("engine_hours", 0)),
                })
            
            return objects
    except httpx.RequestError as e:
        logging.error(f"GPS API request error: {e}")
        raise HTTPException(status_code=502, detail=f"Erreur de connexion à l'API GPS: {str(e)}")
    except Exception as e:
        logging.error(f"GPS API error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur API GPS: {str(e)}")


@router.get("/locations")
async def get_gps_locations(
    imei: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get GPS locations for all objects or a specific IMEI"""
    gps_api_key, gps_api_url = await get_locateur_gps_config(current_user)
    
    if not gps_api_key:
        raise HTTPException(status_code=400, detail="Clé API GPS non configurée")
    
    imei_param = imei if imei else "*"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                gps_api_url,
                params={"api": "user", "key": gps_api_key, "cmd": f"OBJECT_GET_LOCATIONS,{imei_param}"}
            )
            response.raise_for_status()
            data = response.json()
            
            locations = []
            for obj in data:
                locations.append({
                    "imei": obj.get("imei"),
                    "name": obj.get("name"),
                    "lat": float(obj.get("lat", 0)),
                    "lng": float(obj.get("lng", 0)),
                    "speed": float(obj.get("speed", 0)),
                    "angle": float(obj.get("angle", 0)),
                    "altitude": float(obj.get("altitude", 0)),
                    "dt_tracker": obj.get("dt_tracker"),
                    "params": obj.get("params", {}),
                    "loc_valid": obj.get("loc_valid") == "1",
                })
            
            return locations
    except httpx.RequestError as e:
        logging.error(f"GPS API request error: {e}")
        raise HTTPException(status_code=502, detail=f"Erreur de connexion à l'API GPS: {str(e)}")
    except Exception as e:
        logging.error(f"GPS API error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur API GPS: {str(e)}")


@router.get("/route/{imei}")
async def get_gps_route(
    imei: str,
    date_from: str,
    date_to: str,
    stop_duration: int = 5,
    current_user: User = Depends(get_current_user)
):
    """Get route history for a specific object"""
    gps_api_key, gps_api_url = await get_locateur_gps_config(current_user)
    
    if not gps_api_key:
        raise HTTPException(status_code=400, detail="Clé API GPS non configurée")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                gps_api_url,
                params={"api": "user", "key": gps_api_key, "cmd": f"OBJECT_GET_ROUTE,{imei},{date_from},{date_to},{stop_duration}"}
            )
            response.raise_for_status()
            return response.json()
    except httpx.RequestError as e:
        logging.error(f"GPS API request error: {e}")
        raise HTTPException(status_code=502, detail=f"GPS API connection error: {str(e)}")
    except Exception as e:
        logging.error(f"GPS API error: {e}")
        raise HTTPException(status_code=500, detail=f"GPS API error: {str(e)}")


@router.get("/events")
async def get_gps_events(
    current_user: User = Depends(get_current_user)
):
    """Get last 30 minutes events for all objects"""
    gps_api_key, gps_api_url = await get_locateur_gps_config(current_user)
    
    if not gps_api_key:
        raise HTTPException(status_code=400, detail="Clé API GPS non configurée")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                gps_api_url,
                params={"api": "user", "key": gps_api_key, "cmd": "OBJECT_GET_LAST_EVENTS_30M"}
            )
            response.raise_for_status()
            return response.json()
    except httpx.RequestError as e:
        logging.error(f"GPS API request error: {e}")
        raise HTTPException(status_code=502, detail=f"Erreur de connexion à l'API GPS: {str(e)}")
    except Exception as e:
        logging.error(f"GPS API error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur API GPS: {str(e)}")
