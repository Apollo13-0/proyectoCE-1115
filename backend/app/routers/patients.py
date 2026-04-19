from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Any
from ..database import get_db
from ..auth import get_current_user
from ..models import UserRole
from ..schemas import PaginatedResponse, PatientCreate, PatientResponse, PatientUpdate
from ..services import create_patient, delete_patient, get_patients, update_patient
from ..permissions import require_role

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("/dropdown", response_model=list)
def list_patients_dropdown(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Get all patients for dropdown (id, name)"""
    from ..models import Patient
    patients = db.query(Patient.id, Patient.first_name, Patient.last_name).all()
    return [{"id": str(p[0]), "name": f"{p[1]} {p[2]}"} for p in patients]

@router.get("/", response_model=PaginatedResponse)
def list_patients(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    page: int = Query(1, ge=1),
    size: int = Query(100, ge=1, le=100)
):
    return get_patients(db, current_user, page, size)

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_new_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN, UserRole.CIRUJANO]))
):
    return create_patient(db, patient)

@router.put("/{patient_id}", response_model=PatientResponse)
def update_existing_patient(
    patient_id: str,
    updates: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN, UserRole.CIRUJANO]))
):
    patient = update_patient(db, patient_id, updates)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.delete("/{patient_id}")
def delete_existing_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    patient = delete_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Patient deleted"}
