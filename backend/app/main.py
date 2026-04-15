import os
from fastapi import FastAPI
import psycopg2

app = FastAPI(title=os.getenv("APP_NAME", "proyectoCE-1115 API"))


def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))


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
