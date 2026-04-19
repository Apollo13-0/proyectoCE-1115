import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from .database import get_db
from .auth import authenticate_user, create_access_token
from .schemas import LoginRequest, Token
from .routers import surgeries, users, documents, patients, settings

app = FastAPI(title=os.getenv("APP_NAME", "proyectoCE-1115 API"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

@app.post("/auth/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token(data={
        "sub": user.email,
        "id": str(user.id),
        "role": user.role.value,
        "name": f"{user.first_name or ''} {user.last_name or ''}".strip(),
    })
    return {"access_token": access_token, "token_type": "bearer"}

app.include_router(surgeries.router)
app.include_router(users.router)
app.include_router(documents.router)
app.include_router(patients.router)
app.include_router(settings.router)

# Keep existing endpoints
@app.get("/")
def root():
    return {"message": "proyectoCE-1115 running in Docker"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/db-health")
def db_health():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        return {"database": "ok"}
    finally:
        conn.close()
