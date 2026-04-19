from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date, time
from .models import UserRole, RequestStatus, SurgeryStatus, DocumentType
from uuid import UUID

# User schemas
class UserBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    role: UserRole
    license_number: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime

# Patient schemas
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    birth_date: date
    sex: Optional[str] = None
    identity_document: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_notes: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[date] = None
    sex: Optional[str] = None
    identity_document: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_notes: Optional[str] = None

class PatientResponse(PatientBase):
    id: UUID
    user_id: Optional[UUID] = None
    created_at: datetime

# Surgery schemas
class SurgeryBase(BaseModel):
    surgery_type: str
    scheduled_start: datetime
    scheduled_end: datetime
    operating_room: Optional[str] = None
    preop_notes: Optional[str] = None
    postop_notes: Optional[str] = None

class SurgeryCreate(SurgeryBase):
    patient_id: UUID
    lead_surgeon_id: UUID
    anesthesiologist_id: UUID

class SurgeryUpdate(BaseModel):
    patient_id: Optional[UUID] = None
    lead_surgeon_id: Optional[UUID] = None
    anesthesiologist_id: Optional[UUID] = None
    surgery_type: Optional[str] = None
    status: Optional[SurgeryStatus] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    operating_room: Optional[str] = None
    preop_notes: Optional[str] = None
    postop_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None

class SurgeryResponse(SurgeryBase):
    id: UUID
    patient_id: UUID
    lead_surgeon_id: UUID
    anesthesiologist_id: UUID
    status: SurgeryStatus
    created_at: datetime
    patient_name: Optional[str] = None
    surgeon_name: Optional[str] = None
    anesthesiologist_name: Optional[str] = None
    assistants: List[dict] = []

# Document schemas
class DocumentBase(BaseModel):
    document_type: DocumentType
    notes: Optional[str] = None

class DocumentCreate(DocumentBase):
    patient_id: Optional[UUID] = None
    surgery_id: Optional[UUID] = None

class DocumentResponse(DocumentBase):
    id: UUID
    patient_id: Optional[UUID] = None
    surgery_id: Optional[UUID] = None
    file_name: str
    mime_type: str
    file_size_bytes: int
    uploaded_by_user_id: UUID
    uploaded_at: datetime

# Pagination
class PaginatedResponse(BaseModel):
    items: List[dict]
    total: int
    page: int
    size: int

# Auth
class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: str
    password: str
