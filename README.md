# proyectoCE-1115

Sistema base para gestion de citas y cirugias con ejecucion en Docker.

## Requisitos

- Docker
- Docker Compose

## Variables de entorno (.env)

Crear un archivo `.env` en la raiz del proyecto con los campos mostrados en .env.example



## Levantar todo el stack

Desde la raiz del proyecto:

```bash
docker compose up --build
```

Servicios:

- App API: http://localhost:8000
- Health API: http://localhost:8000/health
- DB health API: http://localhost:8000/db-health
- PostgreSQL: localhost:<puerto seleccionado>

## Base de datos

Al iniciar por primera vez, PostgreSQL ejecuta automaticamente un bootstrap que:

1. Crea la base `proyectoce` si no existe.
2. Ejecuta `backend/database/creation_script.sql`.
3. Ejecuta `backend/database/population_script.sql`.

Esto ocurre por el script `backend/database/bootstrap.sql` montado en `/docker-entrypoint-initdb.d` dentro del contenedor de PostgreSQL.

## Reinicio limpio (recrear datos)

```bash
docker compose down -v
docker compose up --build
```