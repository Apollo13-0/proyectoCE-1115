from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date, time
from .models import UserRole, RequestStatus, SurgeryStatus, DocumentType
from uuid import UUID

# User schemas
class UserBase(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    email: str
    phone: Optional[str]
    role: UserRole
    license_number: Optional[str]

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
    sex: Optional[str]
    identity_document: Optional[str]
    insurance_provider: Optional[str]
    insurance_policy_number: Optional[str]
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    medical_notes: Optional[str]

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: UUID
    user_id: Optional[UUID]
    created_at: datetime

# Surgery schemas
class SurgeryBase(BaseModel):
    surgery_type: str
    scheduled_start: datetime
    scheduled_end: datetime
    operating_room: Optional[str]
    preop_notes: Optional[str]
    postop_notes: Optional[str]

class SurgeryCreate(SurgeryBase):
    patient_id: UUID
    lead_surgeon_id: UUID
    anesthesiologist_id: UUID

class SurgeryUpdate(BaseModel):
    status: Optional[SurgeryStatus]
    scheduled_start: Optional[datetime]
    scheduled_end: Optional[datetime]
    operating_room: Optional[str]
    preop_notes: Optional[str]
    postop_notes: Optional[str]
    cancellation_reason: Optional[str]

class SurgeryResponse(SurgeryBase):
    id: UUID
    patient_id: UUID
    lead_surgeon_id: UUID
    anesthesiologist_id: UUID
    status: SurgeryStatus
    created_at: datetime
    patient_name: Optional[str]
    surgeon_name: Optional[str]
    anesthesiologist_name: Optional[str]
    assistants: List[dict] = []

# Document schemas
class DocumentBase(BaseModel):
    document_type: DocumentType
    notes: Optional[str]

class DocumentCreate(DocumentBase):
    patient_id: Optional[UUID]
    surgery_id: Optional[UUID]

class DocumentResponse(DocumentBase):
    id: UUID
    patient_id: Optional[UUID]
    surgery_id: Optional[UUID]
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