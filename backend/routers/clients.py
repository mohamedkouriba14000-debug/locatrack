"""
Client routes for LocaTrack API
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List
from datetime import datetime
import uuid
import shutil

from config import db, UPLOADS_DIR
from models import User, UserRole, Client, ClientCreate
from utils.auth import require_role, get_tenant_id

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("", response_model=List[Client])
async def get_clients(
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    clients = await db.clients.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    for c in clients:
        for date_field in ['created_at', 'license_issue_date']:
            if c.get(date_field) and isinstance(c[date_field], str):
                c[date_field] = datetime.fromisoformat(c[date_field])
    return clients


@router.post("", response_model=Client)
async def create_client(
    client_create: ClientCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    client_data = client_create.model_dump()
    client_data['tenant_id'] = tenant_id
    client_obj = Client(**client_data)
    doc = client_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('license_issue_date'):
        doc['license_issue_date'] = doc['license_issue_date'].isoformat()
    
    await db.clients.insert_one(doc)
    return client_obj


@router.get("/{client_id}")
async def get_client(
    client_id: str,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    """Get a single client by ID"""
    tenant_id = get_tenant_id(current_user)
    client = await db.clients.find_one({"id": client_id, "tenant_id": tenant_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    for date_field in ['created_at', 'license_issue_date']:
        if client.get(date_field) and isinstance(client[date_field], str):
            client[date_field] = datetime.fromisoformat(client[date_field])
    
    return client


@router.put("/{client_id}")
async def update_client(
    client_id: str,
    update_data: dict,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    if update_data.get('license_issue_date') and isinstance(update_data['license_issue_date'], str):
        update_data['license_issue_date'] = datetime.fromisoformat(update_data['license_issue_date'].replace('Z', '+00:00'))
    
    result = await db.clients.update_one(
        {"id": client_id, "tenant_id": tenant_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client updated"}


@router.delete("/{client_id}")
async def delete_client(
    client_id: str,
    current_user: User = Depends(require_role([UserRole.LOCATEUR]))
):
    tenant_id = get_tenant_id(current_user)
    result = await db.clients.delete_one({"id": client_id, "tenant_id": tenant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted"}


@router.post("/upload-license")
async def upload_license(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    """Upload a driver's license image"""
    allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPEG, PNG, PDF")
    
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOADS_DIR / 'licenses' / unique_filename
    
    try:
        with open(file_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    file_url = f"/api/uploads/licenses/{unique_filename}"
    return {"url": file_url, "filename": unique_filename}
