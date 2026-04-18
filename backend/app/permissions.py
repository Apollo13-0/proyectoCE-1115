from fastapi import HTTPException, status
from typing import Any
from .models import AppUser, UserRole

def require_role(required_roles: list[UserRole]):
    from fastapi import Depends
    from .auth import get_current_user

    def decorator(current_user: Any = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return decorator

def can_view_surgery(current_user: AppUser, surgery):
    if current_user.role == UserRole.ADMIN:
        return True
    if current_user.role == UserRole.CIRUJANO and surgery.lead_surgeon_id == current_user.id:
        return True
    if current_user.role == UserRole.ANESTESIOLOGO and surgery.anesthesiologist_id == current_user.id:
        return True
    if current_user.role == UserRole.PACIENTE and current_user.patient and surgery.patient_id == current_user.patient.id:
        return True
    if current_user.role == UserRole.ASISTENTE:
        return any(assist.assistant_user_id == current_user.id for assist in surgery.surgery_assistants)
    return False

def can_modify_surgery(current_user: AppUser, surgery):
    if current_user.role == UserRole.ADMIN:
        return True
    if current_user.role == UserRole.CIRUJANO and surgery.lead_surgeon_id == current_user.id:
        return True
    return False

def can_view_document(current_user: AppUser, doc):
    if current_user.role == UserRole.ADMIN:
        return True
    if doc.patient_id and current_user.patient and doc.patient_id == current_user.patient.id:
        return True
    if doc.surgery_id:
        surgery = doc.surgery
        return can_view_surgery(current_user, surgery)
    return False

def can_delete_document(current_user: AppUser, doc):
    if current_user.role == UserRole.ADMIN:
        return True
    return doc.uploaded_by_user_id == current_user.id and can_view_document(current_user, doc)

def can_upload_for_surgery(current_user: AppUser, surgery):
    if current_user.role == UserRole.ADMIN:
        return True
    return can_view_surgery(current_user, surgery)

def can_upload_for_patient(current_user: AppUser, patient):
    if current_user.role == UserRole.ADMIN:
        return True
    if current_user.patient and current_user.patient.id == patient.id:
        return True
    return False
