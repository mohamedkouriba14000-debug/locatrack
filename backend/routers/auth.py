"""
Authentication routes for LocaTrack API
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta

from config import db
from models import User, UserRole, UserLogin, LocateurRegister, Token
from utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
async def register_locateur(locateur_register: LocateurRegister):
    """Register a new Locateur (rental company owner)"""
    existing_user = await db.users.find_one({"email": locateur_register.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    trial_start = datetime.now(timezone.utc)
    trial_end = trial_start + timedelta(days=15)
    
    user_obj = User(
        email=locateur_register.email,
        full_name=locateur_register.full_name,
        role=UserRole.LOCATEUR,
        phone=locateur_register.phone,
        company_name=locateur_register.company_name,
        tenant_id=None,
        subscription_type="trial",
        subscription_start=trial_start,
        subscription_end=trial_end,
        is_suspended=False
    )
    
    doc = user_obj.model_dump()
    doc['password'] = hash_password(locateur_register.password)
    doc['created_at'] = doc['created_at'].isoformat()
    doc['subscription_start'] = doc['subscription_start'].isoformat() if doc['subscription_start'] else None
    doc['subscription_end'] = doc['subscription_end'].isoformat() if doc['subscription_end'] else None
    
    await db.users.insert_one(doc)
    
    access_token = create_access_token(data={"sub": user_obj.email})
    return Token(access_token=access_token, token_type="bearer", user=user_obj)


@router.post("/login", response_model=Token)
async def login(user_login: UserLogin, request: Request):
    user_doc = await db.users.find_one({"email": user_login.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user_login.password, user_doc.get('password', '')):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user_doc.get('is_suspended') and user_doc.get('role') != UserRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Votre compte est suspendu. Contactez l'administrateur.")
    
    if user_doc.get('role') == UserRole.LOCATEUR:
        subscription_end = user_doc.get('subscription_end')
        if subscription_end:
            if isinstance(subscription_end, str):
                subscription_end = datetime.fromisoformat(subscription_end)
            if subscription_end < datetime.now(timezone.utc):
                raise HTTPException(status_code=403, detail="Votre abonnement a expiré. Veuillez contacter l'administrateur pour renouveler.")
    
    # Get client IP
    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    if client_ip and "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()
    
    # Update last login info
    await db.users.update_one(
        {"email": user_login.email},
        {"$set": {
            "last_ip": client_ip,
            "last_login": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    del user_doc['password']
    del user_doc['_id']
    
    # Update doc with latest info
    user_doc['last_ip'] = client_ip
    user_doc['last_login'] = datetime.now(timezone.utc)
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user_obj = User(**user_doc)
    access_token = create_access_token(data={"sub": user_obj.email})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)


@router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
