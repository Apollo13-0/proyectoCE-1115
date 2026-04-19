from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, Any
from ..database import get_db
from ..auth import get_current_user
from ..models import AppUser, Patient, Surgery
from ..schemas import DocumentCreate, DocumentResponse, PaginatedResponse
from ..services import get_documents, upload_document, get_document, delete_document, get_surgery, serialize_document
from ..permissions import can_view_document, can_delete_document, can_upload_for_surgery, can_upload_for_patient, can_view_surgery

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_file(
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None),
    surgery_id: Optional[str] = Form(None),
    document_type: str = Form(...),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    if not patient_id and not surgery_id:
        raise HTTPException(status_code=400, detail="Must specify patient_id or surgery_id")
    if surgery_id:
        surgery = get_surgery(db, surgery_id)
        if not surgery or not can_upload_for_surgery(current_user, surgery):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
    elif patient_id:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        can_upload_patient_doc = patient and can_upload_for_patient(current_user, patient)
        if patient and not can_upload_patient_doc:
            related_surgeries = db.query(Surgery).filter(Surgery.patient_id == patient.id).all()
            can_upload_patient_doc = any(can_view_surgery(current_user, surgery) for surgery in related_surgeries)
        if not patient or not can_upload_patient_doc:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
    doc_data = DocumentCreate(
        patient_id=patient_id,
        surgery_id=surgery_id,
        document_type=document_type,
        notes=notes
    )
    try:
        return upload_document(db, file, doc_data, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=PaginatedResponse)
def list_documents(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    patient_id: Optional[str] = None,
    surgery_id: Optional[str] = None,
    document_type: Optional[str] = None
):
    filters = {}
    if patient_id: filters['patient_id'] = patient_id
    if surgery_id: filters['surgery_id'] = surgery_id
    if document_type: filters['document_type'] = document_type
    return get_documents(db, current_user, filters, page, size)

@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document_detail(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    doc = get_document(db, doc_id)
    if not doc or not can_view_document(current_user, doc):
        raise HTTPException(status_code=404, detail="Document not found")
    return serialize_document(doc)

@router.get("/{doc_id}/download")
def download_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    doc = get_document(db, doc_id)
    if not doc or not can_view_document(current_user, doc):
        raise HTTPException(status_code=404, detail="Document not found")
    return FileResponse(doc.storage_path, media_type='application/pdf', filename=doc.file_name)

@router.delete("/{doc_id}")
def delete_existing_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    doc = get_document(db, doc_id)
    if not doc or not can_delete_document(current_user, doc):
        raise HTTPException(status_code=404, detail="Document not found")
    delete_document(db, doc_id)
    return {"message": "Document deleted"}
