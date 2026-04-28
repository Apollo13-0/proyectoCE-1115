# Documento de handoff

## Como ejecutar la aplicacion

La aplicacion se ejecuta completa con Docker Compose desde la raiz del repositorio.
Antes de levantar el entorno, crear el archivo `.env` tomando como base `.env.example`:

```bash
cp .env.example .env
```

Variables requeridas:

```env
APP_NAME=proyectoCE-1115 API
APP_PORT=8000
DB_NAME=proyectoce
DB_USER=postgres
DB_PASSWORD=change_me
DB_PORT=5432
```

Para iniciar todo el stack:

```bash
docker compose up --build
```

Servicios publicados:

- Frontend web: `http://localhost/`
- API backend directa: `http://localhost:8000`
- Health check del backend: `http://localhost:8000/health`
- Health check de base de datos: `http://localhost:8000/db-health`
- PostgreSQL: `localhost:5432`, o el puerto configurado en `DB_PORT`

El frontend se publica en el puerto `80` mediante Nginx. Las llamadas del frontend a `/api/` se proxyean internamente hacia el contenedor del backend en el puerto `8000`.

Al iniciar PostgreSQL por primera vez, Docker ejecuta automaticamente el bootstrap de base de datos montado en `/docker-entrypoint-initdb.d`. Este proceso crea o inicializa la base `proyectoce`, ejecuta `backend/database/creation_script.sql` y luego carga datos de prueba desde `backend/database/population_script.sql`.

Para recrear la base de datos desde cero:

```bash
docker compose down -v
docker compose up --build
```

## Dependencias

El entregable requiere:

- Docker Engine o Docker Desktop.
- Docker Compose plugin compatible con el comando `docker compose`.
- Acceso local a los puertos configurados: `80` para el frontend, `8000` para la API y `5432` para PostgreSQL, salvo que se cambien `APP_PORT` o `DB_PORT` en `.env`.

Las imagenes usadas por el stack son:

- `postgres:16-alpine` para la base de datos.
- `python:3.12-slim` para construir y ejecutar el backend FastAPI.
- `node:20-alpine` para compilar el frontend Angular.
- `nginx:stable-alpine` para servir el frontend en produccion.

Como verificar las dependencias:

```bash
docker --version
docker compose version
docker compose config
```

En el ambiente revisado, los comandos disponibles reportaron:

```text
Docker version 29.4.0
Docker Compose version v5.1.1
```

Tambien se puede verificar que los servicios quedaron arriba con:

```bash
docker compose ps
```

Y validar la API con:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/db-health
```

## Que incluye el entregable

El repositorio contiene una aplicacion web para gestion de citas, pacientes, cirugias y documentos medicos. El stack esta compuesto por frontend Angular, backend FastAPI y base de datos PostgreSQL.

Contenido principal del repositorio:

- `docker-compose.yml`: orquestacion de los servicios `db`, `app` y `frontend`, con volumen persistente para PostgreSQL y volumen de archivos subidos.
- `.env.example`: plantilla de variables de entorno necesarias para levantar el stack.
- `README.md`: instrucciones basicas de ejecucion.
- `backend/`: API REST en FastAPI.
- `backend/Dockerfile`: construccion del contenedor Python 3.12 para el backend.
- `backend/requirements.txt`: dependencias Python, incluyendo FastAPI, Uvicorn, SQLAlchemy, Alembic, Psycopg2, Passlib, bcrypt, python-jose y python-multipart.
- `backend/app/`: codigo del backend, autenticacion, modelos, permisos, servicios y routers para usuarios, pacientes, cirugias, documentos y configuracion.
- `backend/database/bootstrap.sql`: script de arranque usado por PostgreSQL al crear el contenedor.
- `backend/database/creation_script.sql`: definicion del esquema de base de datos.
- `backend/database/population_script.sql`: datos de prueba.
- `surgery-app/`: frontend Angular.
- `surgery-app/Dockerfile`: compilacion del frontend con Node 20 y publicacion con Nginx.
- `surgery-app/nginx.conf`: configuracion de Nginx, headers de seguridad y proxy `/api/` hacia el backend.
- `password_generator.py`: utilidad local para generar hashes de contrasena.

Datos de prueba incluidos:

- Usuarios de prueba con roles `ADMIN`, `PACIENTE`, `CIRUJANO`, `ANESTESIOLOGO` y `ASISTENTE`.
- Pacientes de ejemplo.
- Catalogo de anestesiologos.
- Solicitudes de cirugia.
- Cirugia programada.
- Asistentes asignados a cirugia.
- Registros de documentos medicos.
- Registros de auditoria.

Credenciales de prueba documentadas en `backend/database/population_script.sql`:

```text
admin@hospital.local -> Admin2026!
carlos.rojas@correo.com -> CarlosRojas2026!
maria.gomez@correo.com -> MariaGomez2026!
laura.solis@hospital.local -> LauraSolis2026!
diego.mora@hospital.local -> DiegoMora2026!
sofia.arce@hospital.local -> SofiaArce2026!
jorge.vega@hospital.local -> JorgeVega2026!
elena.ruiz@hospital.local -> ElenaRuiz2026!
```

Politicas y controles incluidos:

- Pantallas de politica de seguridad y politica de cookies en el frontend.
- Headers de seguridad configurados en Nginx: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Strict-Transport-Security` y `Content-Security-Policy`.
- Autenticacion con token bearer/JWT.
- Roles de usuario y permisos en el backend.
- Tabla de auditoria inicializada con datos de prueba.

Repositorio que se auditara:

```text
https://github.com/Apollo13-0/proyectoCE-1115.git
```

Referencia local revisada para este handoff:

```text
Rama: develop
Commit: d419b29
Tags locales: no hay tags locales configurados
```

Nota: no se pudo verificar la lista de tags o releases remotos de GitHub desde este entorno porque el acceso remoto fue denegado. Si se crea un release para auditoria, registrar aqui el tag final, por ejemplo `v1.0.0`, y asegurar que apunte al commit que sera evaluado.
