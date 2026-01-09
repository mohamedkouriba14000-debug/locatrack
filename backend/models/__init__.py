"""
Pydantic models for LocaTrack API
"""
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone
import uuid


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
    company_name: Optional[str] = None
    tenant_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    subscription_type: Optional[str] = "trial"
    subscription_start: Optional[datetime] = None
    subscription_end: Optional[datetime] = None
    is_suspended: Optional[bool] = False
    suspension_reason: Optional[str] = None
    gps_api_key: Optional[str] = None
    gps_api_url: Optional[str] = "https://tracking.gps-14.net/api/api.php"


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
    token_type: str = "bearer"
    user: User


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    phone: Optional[str] = None


class Vehicle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    brand: str
    model: str
    year: int
    plate_number: str
    color: str
    daily_rate: float
    status: str = "available"
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    mileage: Optional[int] = None
    insurance_expiry: Optional[datetime] = None
    technical_inspection_expiry: Optional[datetime] = None
    imei: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class VehicleCreate(BaseModel):
    brand: str
    model: str
    year: int
    plate_number: str
    color: str
    daily_rate: float
    status: str = "available"
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    mileage: Optional[int] = None
    insurance_expiry: Optional[str] = None
    technical_inspection_expiry: Optional[str] = None
    imei: Optional[str] = None


class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    license_number: str
    license_issue_date: Optional[datetime] = None
    license_document_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ClientCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    license_number: str
    license_issue_date: Optional[str] = None


class Contract(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    client_id: str
    vehicle_id: str
    start_date: datetime
    end_date: datetime
    daily_rate: float
    total_amount: float
    insurance_fee: float = 0
    additional_fees: float = 0
    status: str = "draft"
    signed: bool = False
    signature_data: Optional[str] = None
    signed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ContractCreate(BaseModel):
    client_id: str
    vehicle_id: str
    start_date: str
    end_date: str
    daily_rate: float
    total_amount: float
    deposit: Optional[float] = 0
    insurance_fee: Optional[float] = 0
    additional_fees: Optional[float] = 0


class ContractSign(BaseModel):
    signature_data: str


class Reservation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    client_id: str
    vehicle_id: str
    start_date: datetime
    end_date: datetime
    status: str = "pending"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReservationCreate(BaseModel):
    client_id: str
    vehicle_id: str
    start_date: str
    end_date: str
    notes: Optional[str] = None


class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    contract_id: str
    amount: float
    method: str
    status: str = "pending"
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
    tenant_id: str
    vehicle_id: str
    type: str
    description: str
    cost: float
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    status: str = "scheduled"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MaintenanceCreate(BaseModel):
    vehicle_id: str
    type: str
    description: str
    cost: float
    scheduled_date: str
    notes: Optional[str] = None


class Infraction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    vehicle_id: str
    contract_id: Optional[str] = None
    type: str
    description: str
    fine_amount: float
    date: datetime
    status: str = "pending"
    location: Optional[str] = None
    paid_by: Optional[str] = None


class InfractionCreate(BaseModel):
    vehicle_id: str
    contract_id: Optional[str] = None
    type: str
    description: str
    fine_amount: float
    date: str
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
    status: str = "issued"


class InvoiceCreate(BaseModel):
    contract_id: str
    amount: float
    tax_amount: float


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
    participants: List[str]
    participant_names: List[str]
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ConversationCreate(BaseModel):
    participant_id: str
