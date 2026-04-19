import json
import os
from fastapi import APIRouter, Depends
from typing import Any
from ..models import UserRole
from ..permissions import require_role

router = APIRouter(prefix="/settings", tags=["settings"])

SETTINGS_PATH = "/app/uploads/app_settings.json"

DEFAULT_SETTINGS = {
    "hospitalName": "Hospital SurgicalOS",
    "hospitalAddress": "",
    "hospitalPhone": "",
    "hospitalEmail": "",
    "timezone": "America/Costa_Rica",
    "sessionTimeout": "60",
    "maxLoginAttempts": "5",
    "requireTwoFactor": False,
    "passwordMinLength": "8",
    "passwordExpireDays": "90",
    "notifyNewSurgery": True,
    "notifyStatusChange": True,
    "notifyNewDocument": False,
    "notifyNewUser": True,
    "emailNotifications": True,
}

def read_settings():
    if not os.path.exists(SETTINGS_PATH):
        return DEFAULT_SETTINGS
    with open(SETTINGS_PATH, "r", encoding="utf-8") as file:
        saved = json.load(file)
    return {**DEFAULT_SETTINGS, **saved}

@router.get("/")
def get_settings(current_user: Any = Depends(require_role([UserRole.ADMIN]))):
    return read_settings()

@router.put("/")
def update_settings(settings: dict, current_user: Any = Depends(require_role([UserRole.ADMIN]))):
    os.makedirs(os.path.dirname(SETTINGS_PATH), exist_ok=True)
    allowed = {key: settings.get(key, value) for key, value in DEFAULT_SETTINGS.items()}
    with open(SETTINGS_PATH, "w", encoding="utf-8") as file:
        json.dump(allowed, file, ensure_ascii=True, indent=2)
    return allowed
