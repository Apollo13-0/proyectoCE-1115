from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from .models import Surgery, MedicalDocument, AppUser, Patient, SurgeryAssistant
from .schemas import SurgeryCreate, SurgeryUpdate, DocumentCreate
from typing import List, Optional
import uuid
import os
import hashlib
import shutil

UPLOAD_DIR = "/app/uploads"

def get_surgeries(db: Session, current_user: AppUser, filters: dict = {}, page: int = 1, size: int = 10):
    query = db.query(Surgery).join(Patient).join(AppUser, Surgery.lead_surgeon_id == AppUser.id)
    
    if current_user.role != "ADMIN":
        conditions = []
        if current_user.role == "CIRUJANO":
            conditions.append(Surgery.lead_surgeon_id == current_user.id)
        elif current_user.role == "ANESTESIOLOGO":
            conditions.append(Surgery.anesthesiologist_id == current_user.id)
        elif current_user.role == "PACIENTE" and current_user.patient:
            conditions.append(Surgery.patient_id == current_user.patient.id)
        elif current_user.role == "ASISTENTE":
            conditions.append(Surgery.id.in_(
                db.query(SurgeryAssistant.surgery_id).filter(SurgeryAssistant.assistant_user_id == current_user.id)
            ))
        if conditions:
            query = query.filter(or_(*conditions))
    
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
    
    items = []
    for surgery in surgeries:
        surgery_dict = {
            "id": str(surgery.id),
            "request_id": str(surgery.request_id) if surgery.request_id else None,
            "patient_id": str(surgery.patient_id),
            "lead_surgeon_id": str(surgery.lead_surgeon_id),
            "anesthesiologist_id": str(surgery.anesthesiologist_id),
            "surgery_type": surgery.surgery_type,
            "status": surgery.status,
            "scheduled_start": surgery.scheduled_start,
            "scheduled_end": surgery.scheduled_end,
            "operating_room": surgery.operating_room,
            "preop_notes": surgery.preop_notes,
            "postop_notes": surgery.postop_notes,
            "created_at": surgery.created_at,
            "patient_name": f"{surgery.patient.first_name} {surgery.patient.last_name}",
            "surgeon_name": f"{surgery.lead_surgeon.first_name} {surgery.lead_surgeon.last_name}",
            "anesthesiologist_name": None,
            "assistants": []
        }
        anesth = db.query(AppUser).filter(AppUser.id == surgery.anesthesiologist_id).first()
        if anesth:
            surgery_dict["anesthesiologist_name"] = f"{anesth.first_name} {anesth.last_name}"
        if surgery.surgery_assistants:
            surgery_dict["assistants"] = [{"id": str(a.assistant_user_id), "name": f"{a.assistant.first_name} {a.assistant.last_name}", "role": a.assistant_role_label} for a in surgery.surgery_assistants]
        items.append(surgery_dict)
    
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
    for key, value in updates.items():
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

def get_documents(db: Session, current_user: AppUser, filters: dict = {}, page: int = 1, size: int = 10):
    query = db.query(MedicalDocument)
    
    if current_user.role != "ADMIN":
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
    items = []
    for doc in docs:
        doc_dict = {
            "id": str(doc.id),
            "document_type": doc.document_type,
            "notes": doc.notes,
            "patient_id": str(doc.patient_id) if doc.patient_id else None,
            "surgery_id": str(doc.surgery_id) if doc.surgery_id else None,
            "file_name": doc.file_name,
            "mime_type": doc.mime_type,
            "file_size_bytes": doc.file_size_bytes,
            "uploaded_by_user_id": str(doc.uploaded_by_user_id),
            "uploaded_at": doc.uploaded_at
        }
        items.append(doc_dict)
    return {"items": items, "total": total, "page": page, "size": size}

def upload_document(db: Session, file, doc_data: DocumentCreate, current_user: AppUser):
    if file.content_type != "application/pdf":
        raise ValueError("Only PDF files allowed")
    
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_content = file.file.read()
    sha256 = hashlib.sha256(file_content).hexdigest()
    
    safe_filename = f"{uuid.uuid4()}.pdf"
    storage_path = os.path.join(UPLOAD_DIR, safe_filename)
    
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
    return {
        "id": str(db_doc.id),
        "document_type": db_doc.document_type,
        "notes": db_doc.notes,
        "patient_id": str(db_doc.patient_id) if db_doc.patient_id else None,
        "surgery_id": str(db_doc.surgery_id) if db_doc.surgery_id else None,
        "file_name": db_doc.file_name,
        "mime_type": db_doc.mime_type,
        "file_size_bytes": db_doc.file_size_bytes,
        "uploaded_by_user_id": str(db_doc.uploaded_by_user_id),
        "uploaded_at": db_doc.uploaded_at
    }

def get_document(db: Session, doc_id: uuid.UUID):
    return db.query(MedicalDocument).filter(MedicalDocument.id == doc_id).first()

def delete_document(db: Session, doc_id: uuid.UUID):
    doc = db.query(MedicalDocument).filter(MedicalDocument.id == doc_id).first()
    if doc:
        os.remove(doc.storage_path)
        db.delete(doc)
        db.commit()
    return doc