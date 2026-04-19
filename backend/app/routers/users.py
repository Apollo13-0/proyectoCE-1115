from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Any
from ..database import get_db
from ..auth import get_current_user, get_password_hash
from ..models import AppUser, UserRole
from ..schemas import UserCreate, UserResponse, PaginatedResponse
from ..services import get_users, get_users_by_role, create_user, update_user, delete_user
from ..permissions import require_role

router = APIRouter(prefix="/users", tags=["users"])

def user_payload(user: UserCreate, role: UserRole):
    data = user.dict(exclude={"password"})
    data["role"] = role
    data["password_hash"] = get_password_hash(user.password)
    return data

@router.get("/surgeons/dropdown", response_model=list)
def list_surgeons_dropdown(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Get all active surgeons for dropdown (id, name)"""
    from ..services import serialize_user
    surgeons = db.query(AppUser).filter(
        AppUser.role == UserRole.CIRUJANO,
        AppUser.is_active == True
    ).all()
    return [{"id": str(s.id), "name": f"{s.first_name} {s.last_name}"} for s in surgeons]

@router.get("/anesthesiologists/dropdown", response_model=list)
def list_anesthesiologists_dropdown(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Get all active anesthesiologists for dropdown (id, name)"""
    anesthesiologists = db.query(AppUser).filter(
        AppUser.role == UserRole.ANESTESIOLOGO,
        AppUser.is_active == True
    ).all()
    return [{"id": str(a.id), "name": f"{a.first_name} {a.last_name}"} for a in anesthesiologists]

@router.get("/assistants/dropdown", response_model=list)
def list_assistants_dropdown(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Get all active assistants for dropdown (id, name)"""
    assistants = db.query(AppUser).filter(
        AppUser.role == UserRole.ASISTENTE,
        AppUser.is_active == True
    ).all()
    return [{"id": str(a.id), "name": f"{a.first_name} {a.last_name}"} for a in assistants]

@router.get("/surgeons", response_model=PaginatedResponse)
def list_surgeons(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100)
):
    return get_users_by_role(db, "CIRUJANO", page, size)

@router.get("/", response_model=PaginatedResponse)
def list_users(
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN])),
    page: int = Query(1, ge=1),
    size: int = Query(100, ge=1, le=100)
):
    return get_users(db, page, size)

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_app_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    return create_user(db, user_payload(user, user.role))

@router.get("/anesthesiologists", response_model=PaginatedResponse)
def list_anesthesiologists(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100)
):
    return get_users_by_role(db, "ANESTESIOLOGO", page, size)

@router.get("/assistants", response_model=PaginatedResponse)
def list_assistants(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100)
):
    return get_users_by_role(db, "ASISTENTE", page, size)

@router.post("/surgeons", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_surgeon(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    return create_user(db, user_payload(user, UserRole.CIRUJANO))

@router.post("/anesthesiologists", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_anesthesiologist(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    return create_user(db, user_payload(user, UserRole.ANESTESIOLOGO))

@router.post("/assistants", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_assistant(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    return create_user(db, user_payload(user, UserRole.ASISTENTE))

@router.put("/surgeons/{user_id}", response_model=UserResponse)
def update_surgeon(
    user_id: str,
    updates: dict,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    user = update_user(db, user_id, updates)
    if not user:
        raise HTTPException(status_code=404, detail="Surgeon not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_app_user(
    user_id: str,
    updates: dict,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    user = update_user(db, user_id, updates)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/anesthesiologists/{user_id}", response_model=UserResponse)
def update_anesthesiologist(
    user_id: str,
    updates: dict,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    user = update_user(db, user_id, updates)
    if not user:
        raise HTTPException(status_code=404, detail="Anesthesiologist not found")
    return user

@router.put("/assistants/{user_id}", response_model=UserResponse)
def update_assistant(
    user_id: str,
    updates: dict,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    user = update_user(db, user_id, updates)
    if not user:
        raise HTTPException(status_code=404, detail="Assistant not found")
    return user

@router.delete("/surgeons/{user_id}")
def delete_surgeon(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    user = delete_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Surgeon not found")
    return {"message": "Surgeon deleted"}

@router.delete("/{user_id}")
def delete_app_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    user = delete_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

@router.delete("/anesthesiologists/{user_id}")
def delete_anesthesiologist(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    user = delete_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Anesthesiologist not found")
    return {"message": "Anesthesiologist deleted"}

@router.delete("/assistants/{user_id}")
def delete_assistant(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_role([UserRole.ADMIN]))
):
    user = delete_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Assistant not found")
    return {"message": "Assistant deleted"}
