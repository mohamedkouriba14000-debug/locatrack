from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import os
import logging
from pathlib import Path
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer()

# ==================== MODELS ====================

class UserRole:
    SUPERADMIN = "superadmin"
    LOCATEUR = "locateur"
    EMPLOYEE = "employee"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: str
    phone: Optional[str] = None
    company_name: Optional[str] = None  # For locateur
    tenant_id: Optional[str] = None  # Links employee to their locateur
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    phone: Optional[str] = None
    company_name: Optional[str] = None

class LocateurRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: str
    phone: Optional[str] = None

class EmployeeCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Vehicle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str  # Links vehicle to locateur
    registration_number: str
    type: str  # sedan, suv, truck, etc.
    make: str
    model: str
    year: int
    chassis_number: str
    color: str
    insurance_number: Optional[str] = None
    insurance_expiry: Optional[datetime] = None
    status: str = "available"  # available, rented, maintenance, unavailable
    daily_rate: float
    gps_device_id: Optional[str] = None
    documents: Optional[List[str]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VehicleCreate(BaseModel):
    registration_number: str
    type: str
    make: str
    model: str
    year: int
    chassis_number: str
    color: str
    insurance_number: Optional[str] = None
    insurance_expiry: Optional[datetime] = None
    daily_rate: float
    gps_device_id: Optional[str] = None

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    national_id: str
    driver_license: str
    license_expiry: datetime
    address: str
    emergency_contact: Optional[str] = None
    verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClientCreate(BaseModel):
    user_id: str
    national_id: str
    driver_license: str
    license_expiry: datetime
    address: str
    emergency_contact: Optional[str] = None

class Contract(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str  # Links contract to locateur
    client_id: str
    vehicle_id: str
    start_date: datetime
    end_date: datetime
    daily_rate: float
    total_amount: float
    insurance_fee: float = 0.0
    additional_fees: float = 0.0
    status: str = "draft"  # draft, active, completed, cancelled
    signed: bool = False
    signature_data: Optional[str] = None
    signed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContractCreate(BaseModel):
    client_id: str
    vehicle_id: str
    start_date: datetime
    end_date: datetime
    daily_rate: float
    insurance_fee: float = 0.0
    additional_fees: float = 0.0

class ContractSign(BaseModel):
    signature_data: str

class Reservation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str  # Links reservation to locateur
    client_id: str
    vehicle_id: str
    start_date: datetime
    end_date: datetime
    status: str = "pending"  # pending, confirmed, cancelled, completed
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReservationCreate(BaseModel):
    client_id: str
    vehicle_id: str
    start_date: datetime
    end_date: datetime
    notes: Optional[str] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str  # Links payment to locateur
    contract_id: str
    amount: float
    method: str  # cib, edahabia, cash, check
    status: str = "pending"  # pending, completed, failed
    reference: Optional[str] = None
    payment_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentCreate(BaseModel):
    contract_id: str
    amount: float
    method: str
    reference: Optional[str] = None

class Maintenance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str  # Links maintenance to locateur
    vehicle_id: str
    type: str  # preventive, emergency, repair
    description: str
    cost: float
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    status: str = "scheduled"  # scheduled, in_progress, completed, cancelled
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MaintenanceCreate(BaseModel):
    vehicle_id: str
    type: str
    description: str
    cost: float
    scheduled_date: datetime
    notes: Optional[str] = None

class Infraction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str  # Links infraction to locateur
    vehicle_id: str
    contract_id: Optional[str] = None
    type: str
    description: str
    amount: float
    date: datetime
    location: Optional[str] = None
    status: str = "pending"  # pending, paid, disputed
    paid_by: Optional[str] = None  # client or company
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InfractionCreate(BaseModel):
    vehicle_id: str
    contract_id: Optional[str] = None
    type: str
    description: str
    amount: float
    date: datetime
    location: Optional[str] = None
    paid_by: Optional[str] = None

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contract_id: str
    invoice_number: str
    amount: float
    tax_amount: float
    total_amount: float
    issued_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "issued"  # issued, paid, cancelled

class InvoiceCreate(BaseModel):
    contract_id: str
    amount: float
    tax_amount: float

# ==================== MESSAGING MODELS ====================

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    sender_id: str
    sender_name: str
    sender_role: str
    content: str
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    conversation_id: str
    content: str

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participants: List[str]  # List of user IDs
    participant_names: List[str]
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: dict = {}  # {user_id: count}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ConversationCreate(BaseModel):
    participant_id: str  # ID of the other user

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    phone: Optional[str] = None

# ==================== AUTHENTICATION ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

def require_role(required_roles: List[str]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

def get_tenant_id(user: User) -> str:
    """Get the tenant_id for the current user"""
    if user.role == UserRole.LOCATEUR:
        return user.id  # Locateur's own ID is the tenant_id
    elif user.role == UserRole.EMPLOYEE:
        return user.tenant_id  # Employee belongs to a locateur
    return None  # SuperAdmin has no tenant

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=Token)
async def register_locateur(locateur_register: LocateurRegister):
    """Register a new Locateur (rental company owner)"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": locateur_register.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create locateur user
    user_obj = User(
        email=locateur_register.email,
        full_name=locateur_register.full_name,
        role=UserRole.LOCATEUR,
        phone=locateur_register.phone,
        company_name=locateur_register.company_name,
        tenant_id=None  # Locateur doesn't have tenant_id, they ARE the tenant
    )
    
    doc = user_obj.model_dump()
    doc['password'] = hash_password(locateur_register.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user_obj.email})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    user_doc = await db.users.find_one({"email": user_login.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user_login.password, user_doc.get('password', '')):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    del user_doc['password']
    del user_doc['_id']
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user_obj = User(**user_doc)
    access_token = create_access_token(data={"sub": user_obj.email})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ==================== EMPLOYEE MANAGEMENT (Locateur only) ====================

@api_router.post("/employees", response_model=User)
async def create_employee(
    employee_create: EmployeeCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR]))
):
    """Create an employee for the locateur's company"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": employee_create.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create employee user linked to this locateur
    user_obj = User(
        email=employee_create.email,
        full_name=employee_create.full_name,
        role=UserRole.EMPLOYEE,
        phone=employee_create.phone,
        tenant_id=current_user.id  # Link employee to locateur
    )
    
    doc = user_obj.model_dump()
    doc['password'] = hash_password(employee_create.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user_obj

@api_router.get("/employees", response_model=List[User])
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

@api_router.put("/employees/{employee_id}")
async def update_employee(
    employee_id: str,
    update_data: dict,
    current_user: User = Depends(require_role([UserRole.LOCATEUR]))
):
    """Update an employee"""
    # Ensure employee belongs to this locateur
    result = await db.users.update_one(
        {"id": employee_id, "tenant_id": current_user.id},
        {"$set": {k: v for k, v in update_data.items() if k not in ['password', 'role', 'tenant_id']}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee updated"}

@api_router.delete("/employees/{employee_id}")
async def delete_employee(
    employee_id: str,
    current_user: User = Depends(require_role([UserRole.LOCATEUR]))
):
    """Delete an employee"""
    result = await db.users.delete_one({"id": employee_id, "tenant_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted"}

# ==================== VEHICLE ROUTES ====================

@api_router.get("/vehicles", response_model=List[Vehicle])
async def get_vehicles(current_user: User = Depends(get_current_user)):
    """Get vehicles for the current tenant"""
    tenant_id = get_tenant_id(current_user)
    if not tenant_id:
        return []  # SuperAdmin sees nothing here
    
    vehicles = await db.vehicles.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    for v in vehicles:
        for date_field in ['created_at', 'insurance_expiry']:
            if v.get(date_field) and isinstance(v[date_field], str):
                v[date_field] = datetime.fromisoformat(v[date_field])
    return vehicles

@api_router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(
    vehicle_create: VehicleCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    """Create a vehicle for the current tenant"""
    tenant_id = get_tenant_id(current_user)
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    vehicle_obj = Vehicle(tenant_id=tenant_id, **vehicle_create.model_dump())
    doc = vehicle_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('insurance_expiry'):
        doc['insurance_expiry'] = doc['insurance_expiry'].isoformat()
    
    await db.vehicles.insert_one(doc)
    return vehicle_obj

@api_router.put("/vehicles/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(
    vehicle_id: str,
    vehicle_update: VehicleCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    """Update a vehicle belonging to the current tenant"""
    tenant_id = get_tenant_id(current_user)
    update_data = vehicle_update.model_dump()
    if update_data.get('insurance_expiry'):
        update_data['insurance_expiry'] = update_data['insurance_expiry'].isoformat()
    
    result = await db.vehicles.update_one(
        {"id": vehicle_id, "tenant_id": tenant_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    vehicle_doc = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    for date_field in ['created_at', 'insurance_expiry']:
        if vehicle_doc.get(date_field) and isinstance(vehicle_doc[date_field], str):
            vehicle_doc[date_field] = datetime.fromisoformat(vehicle_doc[date_field])
    
    return Vehicle(**vehicle_doc)

@api_router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(
    vehicle_id: str,
    current_user: User = Depends(require_role([UserRole.LOCATEUR]))
):
    """Delete a vehicle (Locateur only)"""
    tenant_id = get_tenant_id(current_user)
    result = await db.vehicles.delete_one({"id": vehicle_id, "tenant_id": tenant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Vehicle deleted successfully"}

# ==================== CLIENT ROUTES (simplified) ====================

@api_router.get("/clients", response_model=List[Client])
async def get_clients(
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    clients = await db.clients.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    for c in clients:
        for date_field in ['created_at', 'license_expiry']:
            if c.get(date_field) and isinstance(c[date_field], str):
                c[date_field] = datetime.fromisoformat(c[date_field])
    return clients

@api_router.post("/clients", response_model=Client)
async def create_client(
    client_create: ClientCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    client_obj = Client(**client_create.model_dump())
    doc = client_obj.model_dump()
    doc['tenant_id'] = tenant_id
    doc['created_at'] = doc['created_at'].isoformat()
    doc['license_expiry'] = doc['license_expiry'].isoformat()
    
    await db.clients.insert_one(doc)
    return client_obj

# ==================== CONTRACT ROUTES ====================

@api_router.get("/contracts", response_model=List[Contract])
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

@api_router.post("/contracts", response_model=Contract)
async def create_contract(
    contract_create: ContractCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    # Calculate total amount
    days = (contract_create.end_date - contract_create.start_date).days
    total_amount = (days * contract_create.daily_rate) + contract_create.insurance_fee + contract_create.additional_fees
    
    tenant_id = get_tenant_id(current_user)
    contract_data = contract_create.model_dump()
    contract_data['total_amount'] = total_amount
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

@api_router.post("/contracts/{contract_id}/sign", response_model=Contract)
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
    
    # Update vehicle status
    contract_doc = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    await db.vehicles.update_one(
        {"id": contract_doc['vehicle_id']},
        {"$set": {"status": "rented"}}
    )
    
    for date_field in ['created_at', 'start_date', 'end_date', 'signed_at']:
        if contract_doc.get(date_field) and isinstance(contract_doc[date_field], str):
            contract_doc[date_field] = datetime.fromisoformat(contract_doc[date_field])
    
    return Contract(**contract_doc)

# ==================== RESERVATION ROUTES ====================

@api_router.get("/reservations", response_model=List[Reservation])
async def get_reservations(current_user: User = Depends(get_current_user)):
    tenant_id = get_tenant_id(current_user)
    if not tenant_id:
        return []
    
    reservations = await db.reservations.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    for r in reservations:
        for date_field in ['created_at', 'start_date', 'end_date']:
            if r.get(date_field) and isinstance(r[date_field], str):
                r[date_field] = datetime.fromisoformat(r[date_field])
    return reservations

@api_router.post("/reservations", response_model=Reservation)
async def create_reservation(
    reservation_create: ReservationCreate,
    current_user: User = Depends(require_role([UserRole.LOCATEUR, UserRole.EMPLOYEE]))
):
    tenant_id = get_tenant_id(current_user)
    
    # Check vehicle availability
    vehicle = await db.vehicles.find_one({"id": reservation_create.vehicle_id, "tenant_id": tenant_id}, {"_id": 0})
    if not vehicle or vehicle['status'] != 'available':
        raise HTTPException(status_code=400, detail="Vehicle not available")
    
    reservation_data = reservation_create.model_dump()
    reservation_data['tenant_id'] = tenant_id
    reservation_obj = Reservation(**reservation_data)
    doc = reservation_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['start_date'] = doc['start_date'].isoformat()
    doc['end_date'] = doc['end_date'].isoformat()
    
    await db.reservations.insert_one(doc)
    return reservation_obj

@api_router.put("/reservations/{reservation_id}/status")
async def update_reservation_status(
    reservation_id: str,
    status: str,
    current_user: User = Depends(require_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.EMPLOYEE]))
):
    result = await db.reservations.update_one(
        {"id": reservation_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return {"message": "Reservation status updated"}

# ==================== PAYMENT ROUTES ====================

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(
    current_user: User = Depends(require_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.EMPLOYEE]))
):
    payments = await db.payments.find({}, {"_id": 0}).to_list(1000)
    for p in payments:
        for date_field in ['created_at', 'payment_date']:
            if p.get(date_field) and isinstance(p[date_field], str):
                p[date_field] = datetime.fromisoformat(p[date_field])
    return payments

@api_router.post("/payments", response_model=Payment)
async def create_payment(
    payment_create: PaymentCreate,
    current_user: User = Depends(get_current_user)
):
    payment_obj = Payment(**payment_create.model_dump())
    payment_obj.status = "completed"
    payment_obj.payment_date = datetime.now(timezone.utc)
    
    doc = payment_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('payment_date'):
        doc['payment_date'] = doc['payment_date'].isoformat()
    
    await db.payments.insert_one(doc)
    return payment_obj

# ==================== MAINTENANCE ROUTES ====================

@api_router.get("/maintenance", response_model=List[Maintenance])
async def get_maintenance(
    current_user: User = Depends(require_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.EMPLOYEE]))
):
    maintenances = await db.maintenance.find({}, {"_id": 0}).to_list(1000)
    for m in maintenances:
        for date_field in ['created_at', 'scheduled_date', 'completed_date']:
            if m.get(date_field) and isinstance(m[date_field], str):
                m[date_field] = datetime.fromisoformat(m[date_field])
    return maintenances

@api_router.post("/maintenance", response_model=Maintenance)
async def create_maintenance(
    maintenance_create: MaintenanceCreate,
    current_user: User = Depends(require_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.EMPLOYEE]))
):
    maintenance_obj = Maintenance(**maintenance_create.model_dump())
    doc = maintenance_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['scheduled_date'] = doc['scheduled_date'].isoformat()
    if doc.get('completed_date'):
        doc['completed_date'] = doc['completed_date'].isoformat()
    
    await db.maintenance.insert_one(doc)
    
    # Update vehicle status
    await db.vehicles.update_one(
        {"id": maintenance_create.vehicle_id},
        {"$set": {"status": "maintenance"}}
    )
    
    return maintenance_obj

@api_router.get("/maintenance/alerts")
async def get_maintenance_alerts(
    current_user: User = Depends(require_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.EMPLOYEE]))
):
    # Get upcoming maintenance within next 7 days
    today = datetime.now(timezone.utc)
    week_later = today + timedelta(days=7)
    
    upcoming = await db.maintenance.find(
        {
            "status": "scheduled",
            "scheduled_date": {
                "$gte": today.isoformat(),
                "$lte": week_later.isoformat()
            }
        },
        {"_id": 0}
    ).to_list(100)
    
    return {"alerts": upcoming, "count": len(upcoming)}

@api_router.put("/maintenance/{maintenance_id}")
async def update_maintenance(
    maintenance_id: str,
    update_data: dict,
    current_user: User = Depends(require_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.EMPLOYEE]))
):
    result = await db.maintenance.update_one(
        {"id": maintenance_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Maintenance not found")
    return {"message": "Maintenance updated"}

# ==================== INFRACTION ROUTES ====================

@api_router.get("/infractions", response_model=List[Infraction])
async def get_infractions(
    current_user: User = Depends(require_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.EMPLOYEE]))
):
    infractions = await db.infractions.find({}, {"_id": 0}).to_list(1000)
    for i in infractions:
        for date_field in ['created_at', 'date']:
            if i.get(date_field) and isinstance(i[date_field], str):
                i[date_field] = datetime.fromisoformat(i[date_field])
    return infractions

@api_router.post("/infractions", response_model=Infraction)
async def create_infraction(
    infraction_create: InfractionCreate,
    current_user: User = Depends(require_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.EMPLOYEE]))
):
    infraction_obj = Infraction(**infraction_create.model_dump())
    doc = infraction_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['date'] = doc['date'].isoformat()
    
    await db.infractions.insert_one(doc)
    return infraction_obj

@api_router.put("/infractions/{infraction_id}")
async def update_infraction(
    infraction_id: str,
    update_data: dict,
    current_user: User = Depends(require_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.EMPLOYEE]))
):
    result = await db.infractions.update_one(
        {"id": infraction_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Infraction not found")
    return {"message": "Infraction updated"}

# ==================== REPORTS ROUTES ====================

@api_router.get("/reports/dashboard")
async def get_dashboard_stats(
    current_user: User = Depends(require_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.EMPLOYEE]))
):
    # Count stats
    total_vehicles = await db.vehicles.count_documents({})
    available_vehicles = await db.vehicles.count_documents({"status": "available"})
    rented_vehicles = await db.vehicles.count_documents({"status": "rented"})
    total_clients = await db.clients.count_documents({})
    active_contracts = await db.contracts.count_documents({"status": "active"})
    
    # Revenue calculation (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_payments = await db.payments.find(
        {
            "status": "completed",
            "payment_date": {"$gte": thirty_days_ago}
        },
        {"_id": 0}
    ).to_list(1000)
    
    total_revenue = sum(p['amount'] for p in recent_payments)
    
    # Pending infractions
    pending_infractions = await db.infractions.count_documents({"status": "pending"})
    
    # Upcoming maintenance
    upcoming_maintenance = await db.maintenance.count_documents({"status": "scheduled"})
    
    return {
        "total_vehicles": total_vehicles,
        "available_vehicles": available_vehicles,
        "rented_vehicles": rented_vehicles,
        "total_clients": total_clients,
        "active_contracts": active_contracts,
        "total_revenue_30d": total_revenue,
        "pending_infractions": pending_infractions,
        "upcoming_maintenance": upcoming_maintenance
    }

@api_router.get("/reports/fleet")
async def get_fleet_report(
    current_user: User = Depends(require_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.EMPLOYEE]))
):
    vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(1000)
    
    # Group by status
    status_breakdown = {}
    for v in vehicles:
        status = v.get('status', 'unknown')
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
    
    # Group by type
    type_breakdown = {}
    for v in vehicles:
        vtype = v.get('type', 'unknown')
        type_breakdown[vtype] = type_breakdown.get(vtype, 0) + 1
    
    return {
        "total_vehicles": len(vehicles),
        "status_breakdown": status_breakdown,
        "type_breakdown": type_breakdown
    }

@api_router.get("/reports/financial")
async def get_financial_report(
    current_user: User = Depends(require_role([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    # Get all payments
    payments = await db.payments.find({"status": "completed"}, {"_id": 0}).to_list(10000)
    
    total_revenue = sum(p['amount'] for p in payments)
    
    # Get maintenance costs
    maintenances = await db.maintenance.find({"status": "completed"}, {"_id": 0}).to_list(10000)
    total_maintenance_cost = sum(m['cost'] for m in maintenances)
    
    # Group payments by month
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

# ==================== SUPERADMIN ROUTES ====================

@api_router.get("/admin/users")
async def get_all_users(
    current_user: User = Depends(require_role([UserRole.SUPERADMIN]))
):
    """Get all registered users (SuperAdmin only)"""
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for u in users:
        if u.get('created_at') and isinstance(u['created_at'], str):
            u['created_at'] = datetime.fromisoformat(u['created_at'])
    return users

@api_router.put("/admin/users/{user_id}")
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(require_role([UserRole.SUPERADMIN]))
):
    """Update a user (SuperAdmin only)"""
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    # Prevent changing superadmin's own role
    if user_id == current_user.id and 'role' in update_data:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_role([UserRole.SUPERADMIN]))
):
    """Delete a user (SuperAdmin only)"""
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Also delete user's conversations and messages
    await db.conversations.delete_many({"participants": user_id})
    await db.messages.delete_many({"sender_id": user_id})
    
    return {"message": "User deleted successfully"}

@api_router.get("/admin/stats")
async def get_admin_stats(
    current_user: User = Depends(require_role([UserRole.SUPERADMIN]))
):
    """Get platform statistics (SuperAdmin only)"""
    total_users = await db.users.count_documents({})
    admins = await db.users.count_documents({"role": "admin"})
    employees = await db.users.count_documents({"role": "employee"})
    superadmins = await db.users.count_documents({"role": "superadmin"})
    
    total_vehicles = await db.vehicles.count_documents({})
    total_contracts = await db.contracts.count_documents({})
    total_reservations = await db.reservations.count_documents({})
    
    return {
        "total_users": total_users,
        "superadmins": superadmins,
        "admins": admins,
        "employees": employees,
        "total_vehicles": total_vehicles,
        "total_contracts": total_contracts,
        "total_reservations": total_reservations
    }

# ==================== MESSAGING ROUTES ====================

@api_router.get("/messages/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user)
):
    """Get all conversations for current user"""
    conversations = await db.conversations.find(
        {"participants": current_user.id},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(100)
    
    for c in conversations:
        for date_field in ['created_at', 'last_message_at']:
            if c.get(date_field) and isinstance(c[date_field], str):
                c[date_field] = datetime.fromisoformat(c[date_field])
    
    return conversations

@api_router.post("/messages/conversations")
async def create_conversation(
    conv_create: ConversationCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new conversation with another user"""
    # Check if participant exists
    other_user = await db.users.find_one({"id": conv_create.participant_id}, {"_id": 0, "password": 0})
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if conversation already exists
    existing = await db.conversations.find_one({
        "participants": {"$all": [current_user.id, conv_create.participant_id]}
    }, {"_id": 0})
    
    if existing:
        if existing.get('created_at') and isinstance(existing['created_at'], str):
            existing['created_at'] = datetime.fromisoformat(existing['created_at'])
        if existing.get('last_message_at') and isinstance(existing['last_message_at'], str):
            existing['last_message_at'] = datetime.fromisoformat(existing['last_message_at'])
        return existing
    
    # Create new conversation
    conversation = Conversation(
        participants=[current_user.id, conv_create.participant_id],
        participant_names=[current_user.full_name, other_user['full_name']],
        unread_count={current_user.id: 0, conv_create.participant_id: 0}
    )
    
    doc = conversation.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.conversations.insert_one(doc)
    return conversation

@api_router.get("/messages/conversations/{conversation_id}")
async def get_conversation_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all messages in a conversation"""
    # Verify user is participant
    conversation = await db.conversations.find_one(
        {"id": conversation_id, "participants": current_user.id},
        {"_id": 0}
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get messages
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    for m in messages:
        if m.get('created_at') and isinstance(m['created_at'], str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    
    # Mark messages as read
    await db.messages.update_many(
        {"conversation_id": conversation_id, "sender_id": {"$ne": current_user.id}, "read": False},
        {"$set": {"read": True}}
    )
    
    # Reset unread count
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {f"unread_count.{current_user.id}": 0}}
    )
    
    return messages

@api_router.post("/messages/send")
async def send_message(
    message_create: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    """Send a message in a conversation"""
    # Verify conversation exists and user is participant
    conversation = await db.conversations.find_one(
        {"id": message_create.conversation_id, "participants": current_user.id},
        {"_id": 0}
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Create message
    message = Message(
        conversation_id=message_create.conversation_id,
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        sender_role=current_user.role,
        content=message_create.content
    )
    
    doc = message.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.messages.insert_one(doc)
    
    # Update conversation
    other_participant = [p for p in conversation['participants'] if p != current_user.id][0]
    current_unread = conversation.get('unread_count', {}).get(other_participant, 0)
    
    await db.conversations.update_one(
        {"id": message_create.conversation_id},
        {
            "$set": {
                "last_message": message_create.content[:100],
                "last_message_at": doc['created_at'],
                f"unread_count.{other_participant}": current_unread + 1
            }
        }
    )
    
    return message

@api_router.get("/messages/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user)
):
    """Get total unread messages count"""
    conversations = await db.conversations.find(
        {"participants": current_user.id},
        {"_id": 0, "unread_count": 1}
    ).to_list(100)
    
    total = sum(c.get('unread_count', {}).get(current_user.id, 0) for c in conversations)
    return {"unread_count": total}

@api_router.get("/messages/users")
async def get_available_users_for_chat(
    current_user: User = Depends(get_current_user)
):
    """Get users available for chat (admins and employees can chat with each other)"""
    # SuperAdmin can chat with everyone
    # Admin can chat with superadmin and employees
    # Employee can chat with superadmin and admin
    
    if current_user.role == UserRole.SUPERADMIN:
        query = {"id": {"$ne": current_user.id}}
    elif current_user.role == UserRole.ADMIN:
        query = {"id": {"$ne": current_user.id}, "role": {"$in": ["superadmin", "employee", "admin"]}}
    else:  # Employee
        query = {"id": {"$ne": current_user.id}, "role": {"$in": ["superadmin", "admin"]}}
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(100)
    
    for u in users:
        if u.get('created_at') and isinstance(u['created_at'], str):
            u['created_at'] = datetime.fromisoformat(u['created_at'])
    
    return users

# ==================== INCLUDE ROUTER ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()