"""
GPS Tracking routes for LocaTrack API
Supports multiple GPS API providers:
- tracking.gps-14.net
- iTrack (api.itrack.top)
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
import httpx
import hashlib
import time
import logging

from config import db
from models import User, UserRole
from utils.auth import get_current_user

router = APIRouter(prefix="/gps", tags=["GPS Tracking"])


class GPSConfig(BaseModel):
    provider: str  # 'gps14' or 'itrack'
    api_key: Optional[str] = None  # For gps14
    api_url: Optional[str] = None
    # For iTrack
    account: Optional[str] = None
    password: Optional[str] = None


async def get_locateur_gps_config(current_user: User):
    """Get GPS API configuration for the current user's locateur"""
    if current_user.role == UserRole.LOCATEUR:
        locateur_id = current_user.id
    elif current_user.role == UserRole.EMPLOYEE:
        locateur_id = current_user.tenant_id
    else:
        return None
    
    locateur = await db.users.find_one(
        {"id": locateur_id}, 
        {"_id": 0, "gps_api_key": 1, "gps_api_url": 1, "gps_provider": 1, "gps_account": 1, "gps_password": 1}
    )
    
    if not locateur:
        return None
    
    provider = locateur.get("gps_provider", "gps14")
    
    return {
        "provider": provider,
        "api_key": locateur.get("gps_api_key"),
        "api_url": locateur.get("gps_api_url", "https://tracking.gps-14.net/api/api.php"),
        "account": locateur.get("gps_account"),
        "password": locateur.get("gps_password")
    }


async def get_itrack_token(account: str, password: str):
    """Get iTrack access token"""
    timestamp = int(time.time())
    # md5(md5(password) + time)
    password_md5 = hashlib.md5(password.encode()).hexdigest()
    signature = hashlib.md5(f"{password_md5}{timestamp}".encode()).hexdigest()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://api.itrack.top/api/authorization",
                params={
                    "time": timestamp,
                    "account": account,
                    "signature": signature
                }
            )
            data = response.json()
            
            if data.get("code") != 0:
                raise HTTPException(status_code=401, detail=f"iTrack auth error: {data.get('message', 'Unknown error')}")
            
            return data.get("record", {}).get("access_token")
    except httpx.RequestError as e:
        logging.error(f"iTrack auth error: {e}")
        raise HTTPException(status_code=502, detail=f"iTrack connection error: {str(e)}")


@router.get("/objects")
async def get_gps_objects(
    current_user: User = Depends(get_current_user)
):
    """Get all GPS tracked objects from the configured GPS API"""
    config = await get_locateur_gps_config(current_user)
    
    if not config:
        raise HTTPException(status_code=400, detail="Configuration GPS non trouvée")
    
    provider = config.get("provider", "gps14")
    
    # GPS-14.net API
    if provider == "gps14":
        if not config.get("api_key"):
            raise HTTPException(status_code=400, detail="Clé API GPS non configurée. Veuillez configurer votre clé API GPS dans les paramètres.")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    config.get("api_url", "https://tracking.gps-14.net/api/api.php"),
                    params={"api": "user", "key": config["api_key"], "cmd": "USER_GET_OBJECTS"}
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
                        "speed": float(obj.get("speed", 0)),
                        "angle": float(obj.get("angle", 0)),
                        "active": obj.get("active") == "true",
                        "dt_tracker": obj.get("dt_tracker"),
                        "provider": "gps14"
                    })
                
                return objects
        except httpx.RequestError as e:
            logging.error(f"GPS-14 API error: {e}")
            raise HTTPException(status_code=502, detail=f"Erreur de connexion GPS-14: {str(e)}")
    
    # iTrack API
    elif provider == "itrack":
        if not config.get("account") or not config.get("password"):
            raise HTTPException(status_code=400, detail="Compte ou mot de passe iTrack non configuré")
        
        try:
            access_token = await get_itrack_token(config["account"], config["password"])
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Get device list
                response = await client.get(
                    "https://api.itrack.top/api/device/list",
                    params={"access_token": access_token, "account": config["account"]}
                )
                device_data = response.json()
                
                if device_data.get("code") != 0:
                    raise HTTPException(status_code=400, detail=f"iTrack error: {device_data.get('message')}")
                
                devices = device_data.get("record", [])
                imeis = ",".join([d.get("imei") for d in devices[:100] if d.get("imei")])
                
                if not imeis:
                    return []
                
                # Get tracking data
                track_response = await client.get(
                    "https://api.itrack.top/api/track",
                    params={"access_token": access_token, "imeis": imeis}
                )
                track_data = track_response.json()
                
                if track_data.get("code") != 0:
                    return []
                
                track_records = {r.get("imei"): r for r in track_data.get("record", [])}
                
                objects = []
                for device in devices:
                    imei = device.get("imei")
                    track = track_records.get(imei, {})
                    
                    # Convert Unix timestamp to readable format
                    gps_time = track.get("gpstime", 0)
                    dt_tracker = None
                    if gps_time:
                        from datetime import datetime
                        dt_tracker = datetime.fromtimestamp(gps_time).strftime("%Y-%m-%d %H:%M:%S")
                    
                    objects.append({
                        "imei": imei,
                        "name": device.get("devicename", imei),
                        "model": device.get("devicetype", ""),
                        "plate_number": device.get("platenumber", ""),
                        "lat": float(track.get("latitude", 0)),
                        "lng": float(track.get("longitude", 0)),
                        "speed": float(track.get("speed", 0)),
                        "angle": float(track.get("course", 0)),
                        "active": track.get("datastatus") == 2,
                        "dt_tracker": dt_tracker,
                        "acc_status": track.get("accstatus", -1),
                        "battery": track.get("battery", -1),
                        "provider": "itrack"
                    })
                
                return objects
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"iTrack API error: {e}")
            raise HTTPException(status_code=500, detail=f"Erreur API iTrack: {str(e)}")
    
    else:
        raise HTTPException(status_code=400, detail=f"Provider GPS non supporté: {provider}")


@router.get("/track/{imei}")
async def get_single_track(
    imei: str,
    current_user: User = Depends(get_current_user)
):
    """Get tracking data for a single device"""
    config = await get_locateur_gps_config(current_user)
    
    if not config:
        raise HTTPException(status_code=400, detail="Configuration GPS non trouvée")
    
    provider = config.get("provider", "gps14")
    
    if provider == "itrack":
        if not config.get("account") or not config.get("password"):
            raise HTTPException(status_code=400, detail="Configuration iTrack incomplète")
        
        try:
            access_token = await get_itrack_token(config["account"], config["password"])
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    "https://api.itrack.top/api/track",
                    params={"access_token": access_token, "imeis": imei}
                )
                data = response.json()
                
                if data.get("code") != 0:
                    raise HTTPException(status_code=400, detail=f"iTrack error: {data.get('message')}")
                
                records = data.get("record", [])
                if not records:
                    raise HTTPException(status_code=404, detail="Device not found")
                
                track = records[0]
                from datetime import datetime
                gps_time = track.get("gpstime", 0)
                
                return {
                    "imei": track.get("imei"),
                    "lat": float(track.get("latitude", 0)),
                    "lng": float(track.get("longitude", 0)),
                    "speed": float(track.get("speed", 0)),
                    "angle": float(track.get("course", 0)),
                    "gps_time": datetime.fromtimestamp(gps_time).isoformat() if gps_time else None,
                    "acc_status": track.get("accstatus", -1),
                    "battery": track.get("battery", -1),
                    "data_status": track.get("datastatus", 1)
                }
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"iTrack track error: {e}")
            raise HTTPException(status_code=500, detail=f"Erreur iTrack: {str(e)}")
    
    else:
        # GPS-14 single location
        if not config.get("api_key"):
            raise HTTPException(status_code=400, detail="Clé API GPS non configurée")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    config.get("api_url", "https://tracking.gps-14.net/api/api.php"),
                    params={"api": "user", "key": config["api_key"], "cmd": f"OBJECT_GET_LOCATIONS,{imei}"}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/playback/{imei}")
async def get_playback(
    imei: str,
    begin_time: int,
    end_time: int,
    current_user: User = Depends(get_current_user)
):
    """Get playback/history data for a device (iTrack specific)"""
    config = await get_locateur_gps_config(current_user)
    
    if not config:
        raise HTTPException(status_code=400, detail="Configuration GPS non trouvée")
    
    if config.get("provider") != "itrack":
        raise HTTPException(status_code=400, detail="Playback only available for iTrack")
    
    try:
        access_token = await get_itrack_token(config["account"], config["password"])
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                "https://api.itrack.top/api/playback",
                params={
                    "access_token": access_token,
                    "imei": imei,
                    "begintime": begin_time,
                    "endtime": end_time
                }
            )
            data = response.json()
            
            if data.get("code") != 0:
                raise HTTPException(status_code=400, detail=f"iTrack error: {data.get('message')}")
            
            # Parse playback record: "lng,lat,gpstime,speed,course;lng,lat,gpstime,speed,course;..."
            record = data.get("record", "")
            points = []
            
            if record:
                for point_str in record.split(";"):
                    if point_str:
                        parts = point_str.split(",")
                        if len(parts) >= 5:
                            points.append({
                                "lng": float(parts[0]),
                                "lat": float(parts[1]),
                                "gps_time": int(parts[2]),
                                "speed": int(parts[3]),
                                "course": int(parts[4])
                            })
            
            return {"points": points, "count": len(points)}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"iTrack playback error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur iTrack: {str(e)}")


@router.get("/devices")
async def get_devices_list(
    current_user: User = Depends(get_current_user)
):
    """Get device list (iTrack specific with more details)"""
    config = await get_locateur_gps_config(current_user)
    
    if not config:
        raise HTTPException(status_code=400, detail="Configuration GPS non trouvée")
    
    if config.get("provider") != "itrack":
        # For GPS-14, use objects endpoint
        return await get_gps_objects(current_user)
    
    try:
        access_token = await get_itrack_token(config["account"], config["password"])
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://api.itrack.top/api/device/list",
                params={"access_token": access_token, "account": config["account"]}
            )
            data = response.json()
            
            if data.get("code") != 0:
                raise HTTPException(status_code=400, detail=f"iTrack error: {data.get('message')}")
            
            devices = []
            from datetime import datetime
            
            for d in data.get("record", []):
                devices.append({
                    "imei": d.get("imei"),
                    "name": d.get("devicename"),
                    "type": d.get("devicetype"),
                    "plate_number": d.get("platenumber"),
                    "sim_card": d.get("simcard"),
                    "iccid": d.get("iccid"),
                    "first_online": datetime.fromtimestamp(d.get("onlinetime", 0)).isoformat() if d.get("onlinetime") else None,
                    "platform_expiry": datetime.fromtimestamp(d.get("platformduetime", 0)).isoformat() if d.get("platformduetime") else None,
                    "activated": datetime.fromtimestamp(d.get("activatedtime", 0)).isoformat() if d.get("activatedtime") else None
                })
            
            return devices
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"iTrack devices error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur iTrack: {str(e)}")
