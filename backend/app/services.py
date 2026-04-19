from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from .models import Surgery, MedicalDocument, AppUser, Patient, SurgeryAssistant, UserRole
from .schemas import SurgeryCreate, SurgeryUpdate, DocumentCreate, PatientCreate, PatientUpdate
from typing import List, Optional
import uuid
import os
import hashlib

UPLOAD_DIR = "/app/uploads"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
PDF_HEADER = b"%PDF-"

def serialize_surgery(db: Session, surgery: Surgery):
    anesth = db.query(AppUser).filter(AppUser.id == surgery.anesthesiologist_id).first()
    return {
        "id": str(surgery.id),
        "request_id": str(surgery.request_id) if surgery.request_id else None,
        "patient_id": str(surgery.patient_id),
        "lead_surgeon_id": str(surgery.lead_surgeon_id),
        "anesthesiologist_id": str(surgery.anesthesiologist_id),
        "surgery_type": surgery.surgery_type,
        "status": surgery.status.value if hasattr(surgery.status, "value") else surgery.status,
        "scheduled_start": surgery.scheduled_start,
        "scheduled_end": surgery.scheduled_end,
        "operating_room": surgery.operating_room,
        "preop_notes": surgery.preop_notes,
        "postop_notes": surgery.postop_notes,
        "created_at": surgery.created_at,
        "patient_name": f"{surgery.patient.first_name} {surgery.patient.last_name}" if surgery.patient else None,
        "surgeon_name": f"{surgery.lead_surgeon.first_name} {surgery.lead_surgeon.last_name}" if surgery.lead_surgeon else None,
        "anesthesiologist_name": f"{anesth.first_name} {anesth.last_name}" if anesth else None,
        "assistants": [
            {
                "id": str(a.assistant_user_id),
                "name": f"{a.assistant.first_name} {a.assistant.last_name}",
                "role": a.assistant_role_label,
            }
            for a in surgery.surgery_assistants
        ],
    }

def get_surgeries(db: Session, current_user: AppUser, filters: dict = {}, page: int = 1, size: int = 10):
    query = db.query(Surgery).join(Patient).join(AppUser, Surgery.lead_surgeon_id == AppUser.id)
    
    if current_user.role != UserRole.ADMIN:
        conditions = []
        if current_user.role == UserRole.CIRUJANO:
            conditions.append(Surgery.lead_surgeon_id == current_user.id)
        elif current_user.role == UserRole.ANESTESIOLOGO:
            conditions.append(Surgery.anesthesiologist_id == current_user.id)
        elif current_user.role == UserRole.PACIENTE and current_user.patient:
            conditions.append(Surgery.patient_id == current_user.patient.id)
        elif current_user.role == UserRole.ASISTENTE:
            conditions.append(Surgery.id.in_(
                db.query(SurgeryAssistant.surgery_id).filter(SurgeryAssistant.assistant_user_id == current_user.id)
            ))
        if conditions:
            query = query.filter(or_(*conditions))
        else:
            query = query.filter(False)
    
    if 'date_from' in filters:
        query = query.filter(Surgery.scheduled_start >= filters['date_from'])
    if 'date_to' in filters:
        query = query.filter(Surgery.scheduled_start <= filters['date_to'])
    if 'status' in filters:
        query = query.filter(Surgery.status == filters['status'])
    if 'surgery_type' in filters:
        query = query.filter(Surgery.surgery_type.ilike(f"%{filters['surgery_type']}%"))
    if 'patient_id' in filters:
        query = query.filter(Surgery.patient_id == filters['patient_id'])
    if 'surgeon_id' in filters:
        query = query.filter(Surgery.lead_surgeon_id == filters['surgeon_id'])
    if 'anesthesiologist_id' in filters:
        query = query.filter(Surgery.anesthesiologist_id == filters['anesthesiologist_id'])
    
    total = query.count()
    surgeries = query.offset((page - 1) * size).limit(size).all()
    
    items = [serialize_surgery(db, surgery) for surgery in surgeries]
    
    return {"items": items, "total": total, "page": page, "size": size}

def get_surgery(db: Session, surgery_id: uuid.UUID):
    return db.query(Surgery).filter(Surgery.id == surgery_id).first()

def create_surgery(db: Session, surgery: SurgeryCreate, current_user: AppUser):
    db_surgery = Surgery(**surgery.dict(), created_by_user_id=current_user.id)
    db.add(db_surgery)
    db.commit()
    db.refresh(db_surgery)
    return db_surgery

def update_surgery(db: Session, surgery_id: uuid.UUID, updates: SurgeryUpdate):
    surgery = db.query(Surgery).filter(Surgery.id == surgery_id).first()
    if not surgery:
        return None
    for key, value in updates.dict(exclude_unset=True).items():
        if key in {"patient_id", "lead_surgeon_id", "anesthesiologist_id"} and value is None:
            continue
        setattr(surgery, key, value)
    db.commit()
    db.refresh(surgery)
    return surgery

def delete_surgery(db: Session, surgery_id: uuid.UUID):
    surgery = db.query(Surgery).filter(Surgery.id == surgery_id).first()
    if surgery:
        db.delete(surgery)
        db.commit()
    return surgery

def get_users_by_role(db: Session, role: str, page: int = 1, size: int = 10):
    query = db.query(AppUser).filter(AppUser.role == role)
    total = query.count()
    users = query.offset((page - 1) * size).limit(size).all()
    items = []
    for user in users:
        user_dict = {
            "id": str(user.id),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "license_number": user.license_number,
            "is_active": user.is_active,
            "created_at": user.created_at
        }
        items.append(user_dict)
    return {"items": items, "total": total, "page": page, "size": size}

def create_user(db: Session, user: dict):
    db_user = AppUser(**user)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {
        "id": str(db_user.id),
        "first_name": db_user.first_name,
        "last_name": db_user.last_name,
        "email": db_user.email,
        "phone": db_user.phone,
        "role": db_user.role,
        "license_number": db_user.license_number,
        "is_active": db_user.is_active,
        "created_at": db_user.created_at
    }

def update_user(db: Session, user_id: uuid.UUID, updates: dict):
    user = db.query(AppUser).filter(AppUser.id == user_id).first()
    if not user:
        return None
    if "password" in updates:
        from .auth import get_password_hash
        updates["password_hash"] = get_password_hash(updates.pop("password"))
    updates.pop("id", None)
    updates.pop("created_at", None)
    for key, value in updates.items():
        if hasattr(user, key):
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return {
        "id": str(user.id),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "license_number": user.license_number,
        "is_active": user.is_active,
        "created_at": user.created_at
    }

def delete_user(db: Session, user_id: uuid.UUID):
    user = db.query(AppUser).filter(AppUser.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
    return user

def serialize_user(user: AppUser):
    return {
        "id": str(user.id),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role.value if hasattr(user.role, "value") else user.role,
        "license_number": user.license_number,
        "is_active": user.is_active,
        "created_at": user.created_at
    }

def get_users(db: Session, page: int = 1, size: int = 100):
    query = db.query(AppUser)
    total = query.count()
    users = query.offset((page - 1) * size).limit(size).all()
    return {
        "items": [serialize_user(user) for user in users],
        "total": total,
        "page": page,
        "size": size
    }

def serialize_patient(patient: Patient):
    return {
        "id": str(patient.id),
        "user_id": str(patient.user_id) if patient.user_id else None,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "birth_date": patient.birth_date,
        "sex": patient.sex,
        "identity_document": patient.identity_document,
        "insurance_provider": patient.insurance_provider,
        "insurance_policy_number": getattr(patient, "insurance_policy_numer", None),
        "emergency_contact_name": patient.emergency_contact_name,
        "emergency_contact_phone": patient.emergency_contact_phone,
        "medical_notes": patient.medical_notes,
        "created_at": patient.created_at,
    }

def create_patient(db: Session, patient: PatientCreate):
    data = patient.dict()
    data["insurance_policy_numer"] = data.pop("insurance_policy_number", None)
    db_patient = Patient(**data)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return serialize_patient(db_patient)

def update_patient(db: Session, patient_id: uuid.UUID, updates: PatientUpdate):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return None
    data = updates.dict(exclude_unset=True)
    if "insurance_policy_number" in data:
        data["insurance_policy_numer"] = data.pop("insurance_policy_number")
    for key, value in data.items():
        if hasattr(patient, key):
            setattr(patient, key, value)
    db.commit()
    db.refresh(patient)
    return serialize_patient(patient)

def delete_patient(db: Session, patient_id: uuid.UUID):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient:
        db.delete(patient)
        db.commit()
    return patient

def get_patients(db: Session, current_user: AppUser, page: int = 1, size: int = 100):
    query = db.query(Patient)

    if current_user.role == UserRole.PACIENTE:
        if current_user.patient:
            query = query.filter(Patient.id == current_user.patient.id)
        else:
            query = query.filter(False)
    elif current_user.role == UserRole.CIRUJANO:
        pass
    elif current_user.role == UserRole.ANESTESIOLOGO:
        query = query.filter(Patient.id.in_(
            db.query(Surgery.patient_id).filter(Surgery.anesthesiologist_id == current_user.id)
        ))
    elif current_user.role == UserRole.ASISTENTE:
        surgery_ids = db.query(SurgeryAssistant.surgery_id).filter(SurgeryAssistant.assistant_user_id == current_user.id)
        query = query.filter(Patient.id.in_(
            db.query(Surgery.patient_id).filter(Surgery.id.in_(surgery_ids))
        ))

    total = query.count()
    patients = query.offset((page - 1) * size).limit(size).all()
    return {
        "items": [serialize_patient(patient) for patient in patients],
        "total": total,
        "page": page,
        "size": size,
    }

def serialize_document(doc: MedicalDocument):
    return {
        "id": str(doc.id),
        "document_type": doc.document_type.value if hasattr(doc.document_type, "value") else doc.document_type,
        "notes": doc.notes,
        "patient_id": str(doc.patient_id) if doc.patient_id else None,
        "surgery_id": str(doc.surgery_id) if doc.surgery_id else None,
        "file_name": doc.file_name,
        "mime_type": doc.mime_type,
        "file_size_bytes": doc.file_size_bytes,
        "uploaded_by_user_id": str(doc.uploaded_by_user_id),
        "uploaded_at": doc.uploaded_at
    }

def get_documents(db: Session, current_user: AppUser, filters: dict = {}, page: int = 1, size: int = 10):
    query = db.query(MedicalDocument)
    
    if current_user.role != UserRole.ADMIN:
        conditions = []
        if current_user.patient:
            conditions.append(MedicalDocument.patient_id == current_user.patient.id)
        surgery_ids = db.query(Surgery.id).filter(
            or_(
                Surgery.lead_surgeon_id == current_user.id,
                Surgery.anesthesiologist_id == current_user.id,
                Surgery.id.in_(db.query(SurgeryAssistant.surgery_id).filter(SurgeryAssistant.assistant_user_id == current_user.id))
            )
        ).subquery()
        conditions.append(MedicalDocument.surgery_id.in_(surgery_ids))
        query = query.filter(or_(*conditions))
    
    if 'patient_id' in filters:
        query = query.filter(MedicalDocument.patient_id == filters['patient_id'])
    if 'surgery_id' in filters:
        query = query.filter(MedicalDocument.surgery_id == filters['surgery_id'])
    if 'document_type' in filters:
        query = query.filter(MedicalDocument.document_type == filters['document_type'])
    
    total = query.count()
    docs = query.offset((page - 1) * size).limit(size).all()
    items = [serialize_document(doc) for doc in docs]
    return {"items": items, "total": total, "page": page, "size": size}

def upload_document(db: Session, file, doc_data: DocumentCreate, current_user: AppUser):
    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise ValueError("Only PDF files allowed")
    
    upload_dir = os.path.abspath(UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)

    file_content = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(file_content) > MAX_UPLOAD_BYTES:
        raise ValueError("PDF file is too large")
    if not file_content.startswith(PDF_HEADER):
        raise ValueError("Only valid PDF files allowed")

    sha256 = hashlib.sha256(file_content).hexdigest()
    
    safe_filename = f"{uuid.uuid4()}.pdf"
    storage_path = os.path.abspath(os.path.join(upload_dir, safe_filename))
    if os.path.commonpath([upload_dir, storage_path]) != upload_dir:
        raise ValueError("Invalid storage path")
    
    with open(storage_path, "wb") as f:
        f.write(file_content)
    
    db_doc = MedicalDocument(
        **doc_data.dict(),
        file_name=file.filename,
        mime_type=file.content_type,
        file_size_bytes=len(file_content),
        storage_path=storage_path,
        sha256=sha256,
        uploaded_by_user_id=current_user.id
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return serialize_document(db_doc)

def get_document(db: Session, doc_id: uuid.UUID):
    return db.query(MedicalDocument).filter(MedicalDocument.id == doc_id).first()

def delete_document(db: Session, doc_id: uuid.UUID):
    doc = db.query(MedicalDocument).filter(MedicalDocument.id == doc_id).first()
    if doc:
        if os.path.exists(doc.storage_path):
            os.remove(doc.storage_path)
        db.delete(doc)
        db.commit()
    return doc
