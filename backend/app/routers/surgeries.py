from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, Any, List
from datetime import datetime, date
from ..database import get_db
from ..auth import get_current_user
from ..models import AppUser, Surgery
from ..schemas import SurgeryCreate, SurgeryUpdate, SurgeryResponse, PaginatedResponse
from ..services import get_surgeries, get_surgery, create_surgery, update_surgery, delete_surgery, serialize_surgery, get_surgeries_for_calendar
from ..permissions import require_role, can_view_surgery, can_modify_surgery
from ..models import UserRole

router = APIRouter(prefix="/surgeries", tags=["surgeries"])

@router.get("/types", response_model=list)
def get_surgery_types(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Get all unique surgery types for dropdown"""
    types = db.query(Surgery.surgery_type).distinct().all()
    return [{"id": t[0], "name": t[0]} for t in types]

@router.get("/calendar", response_model=List[SurgeryResponse])
def get_calendar_surgeries(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    month: int = Query(datetime.now().month, ge=1, le=12),
    year: int = Query(datetime.now().year, ge=2020)
):
    """Get surgeries for calendar view by month and year"""
    surgeries = get_surgeries_for_calendar(db, current_user, month, year)
    return [serialize_surgery(db, surgery) for surgery in surgeries]

@router.get("/", response_model=PaginatedResponse)
def list_surgeries(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None,
    surgery_type: Optional[str] = None,
    patient_id: Optional[str] = None,
    surgeon_id: Optional[str] = None,
    anesthesiologist_id: Optional[str] = None
):
    filters = {}
    if date_from: filters['date_from'] = date_from
    if date_to: filters['date_to'] = date_to
    if status: filters['status'] = status
    if surgery_type: filters['surgery_type'] = surgery_type
    if patient_id: filters['patient_id'] = patient_id
    if surgeon_id: filters['surgeon_id'] = surgeon_id
    if anesthesiologist_id: filters['anesthesiologist_id'] = anesthesiologist_id
    
    return get_surgeries(db, current_user, filters, page, size)

@router.get("/{surgery_id}", response_model=SurgeryResponse)
def get_surgery_detail(
    surgery_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    surgery = get_surgery(db, surgery_id)
    if not surgery or not can_view_surgery(current_user, surgery):
        raise HTTPException(status_code=404, detail="Surgery not found")
    return serialize_surgery(db, surgery)

@router.post("/", response_model=SurgeryResponse, status_code=status.HTTP_201_CREATED)
def create_new_surgery(
    surgery: SurgeryCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN, UserRole.CIRUJANO]))
):
    created = create_surgery(db, surgery, current_user)
    return serialize_surgery(db, created)

@router.put("/{surgery_id}", response_model=SurgeryResponse)
def update_existing_surgery(
    surgery_id: str,
    updates: SurgeryUpdate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    surgery = get_surgery(db, surgery_id)
    if not surgery or not can_modify_surgery(current_user, surgery):
        raise HTTPException(status_code=404, detail="Surgery not found or no permission")
    if current_user.role != UserRole.ADMIN:
        updates.patient_id = None
        updates.lead_surgeon_id = None
        updates.anesthesiologist_id = None
    surgery = update_surgery(db, surgery_id, updates)
    return serialize_surgery(db, surgery)

@router.patch("/{surgery_id}/status")
def update_surgery_status(
    surgery_id: str,
    status_update: dict,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    surgery = get_surgery(db, surgery_id)
    if not surgery or not can_modify_surgery(current_user, surgery):
        raise HTTPException(status_code=404, detail="Surgery not found or no permission")
    updates = SurgeryUpdate(status=status_update.get('status'))
    surgery = update_surgery(db, surgery_id, updates)
    return serialize_surgery(db, surgery)

@router.delete("/{surgery_id}")
def delete_existing_surgery(
    surgery_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    surgery = delete_surgery(db, surgery_id)
    if not surgery:
        raise HTTPException(status_code=404, detail="Surgery not found")
    return {"message": "Surgery deleted"}

@router.post("/{surgery_id}/assistants")
def assign_assistants(
    surgery_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Assign assistants to a surgery"""
    from ..models import SurgeryAssistant
    
    surgery = get_surgery(db, surgery_id)
    if not surgery or not can_modify_surgery(current_user, surgery):
        raise HTTPException(status_code=404, detail="Surgery not found or no permission")
    
    assistant_ids = payload.get('assistant_ids', [])
    
    # Clear existing assistants
    db.query(SurgeryAssistant).filter(SurgeryAssistant.surgery_id == surgery_id).delete()
    
    # Add new assistants
    for assistant_id in assistant_ids:
        assistant = db.query(AppUser).filter(AppUser.id == assistant_id).first()
        if not assistant or assistant.role != UserRole.ASISTENTE:
            raise HTTPException(status_code=400, detail=f"Invalid assistant ID: {assistant_id}")
        
        surgery_assistant = SurgeryAssistant(surgery_id=surgery_id, assistant_id=assistant_id)
        db.add(surgery_assistant)
    
    db.commit()
    return serialize_surgery(db, surgery)

@router.get("/{surgery_id}/documents")
def get_surgery_documents(
    surgery_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Get all documents for a specific surgery"""
    from ..models import MedicalDocument
    from ..services import serialize_document
    
    surgery = get_surgery(db, surgery_id)
    if not surgery or not can_view_surgery(current_user, surgery):
        raise HTTPException(status_code=404, detail="Surgery not found or no permission")
    
    documents = db.query(MedicalDocument).filter(
        MedicalDocument.surgery_id == surgery_id
    ).order_by(MedicalDocument.uploaded_at.desc()).all()
    
    return [serialize_document(doc) for doc in documents]
