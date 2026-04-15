-- Active: 1760291426755@@127.0.0.1@5432@database_sample2
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--TIPOS DE DOMINIO
CREATE TYPE user_role AS ENUM (
    'ADMIN',
    'PACIENTE',
    'CIRUJANO',
    'ANESTESIOLOGO',
    'ASISTENTE'
);

CREATE TYPE request_status AS ENUM (
    'BORRADOR',
    'ENVIADA',
    'EN_REVISION',
    'APROBADA',
    'RECHAZADA',
    'CANCELADA'
);

CREATE  TYPE surgery_status AS ENUM (
    'SOLICITADA',
    'PENDIENTE_VALIDACION',
    'PROGRAMADA',
    'EN_CURSO',
    'COMPLETADA',
    'CANCELADA'
);

CREATE TYPE document_type AS ENUM (
    'POLIZA_SEGURO',
    'NOTA_MEDICA',
    'CONSENTIMIENTO_INFORMADO',
    'EXAMEN_PREOP',
    'OTRO'
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

--USUARIOS
CREATE TABLE app_user(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL,
    first_name VARCHAR(80),
    last_name VARCHAR(80),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    license_number VARCHAR(60),
    CONSTRAINT chk_license_for_medical_roles
    CHECK (
      role NOT IN ('CIRUJANO', 'ANESTESIOLOGO') OR license_number IS NOT NULL
    )
);

CREATE TRIGGER trg_app_user_updated_at
BEFORE UPDATE ON app_user
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

--PACIENTES
CREATE TABLE patient (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES app_user(id) ON DELETE SET NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    birth_date DATE NOT NULL,
    sex VARCHAR(20),
    identity_document VARCHAR(50) UNIQUE,
    insurance_provider VARCHAR(120),
    insurance_policy_numer VARCHAR(80),
    emergency_contact_name VARCHAR(120),
    emergency_contact_phone VARCHAR(30),
    medical_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_patient_updated_at
BEFORE UPDATE ON patient
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

--CATALOGO DE ANESTESIOLOGOS
CREATE TABLE anesthesiologist_catalog (
  user_id UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--SOLICITUD DE CIRUGIA
CREATE TABLE surgery_request(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    requested_by_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    requested_date DATE NOT NULL,
    requested_time TIME,
    surgery_type VARCHAR(120) NOT NULL,
    reason TEXT,
    priority SMALLINT NOT NULL DEFAULT 3 CHECK(priority BETWEEN 1 AND 5),
    status request_status NOT NULL DEFAULT 'ENVIADA',
    reviewed_by_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--CIRUGIA PROGRAMADA
CREATE TABLE surgery(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID UNIQUE REFERENCES surgery_request(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    lead_surgeon_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    anesthesiologist_id UUID NOT NULL REFERENCES anesthesiologist_catalog(user_id) ON DELETE RESTRICT,
    surgery_type VARCHAR(120) NOT NULL,
    status surgery_status NOT NULL DEFAULT 'PROGRAMADA',
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    operating_room VARCHAR(30),
    preop_notes TEXT,
    postop_notes TEXT,
    cancellation_reason TEXT,
    created_by_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_surgery_time CHECK (scheduled_end > scheduled_start)
);

--indices para performance 
CREATE INDEX idx_surgery_calendar ON surgery(scheduled_start, status);
CREATE INDEX idx_surgery_patient ON surgery(patient_id);
CREATE INDEX idx_surgery_surgeon ON surgery(lead_surgeon_id);
CREATE INDEX idx_surgery_anesth ON surgery(anesthesiologist_id);

CREATE TRIGGER trg_surgery_updated_at
BEFORE UPDATE ON surgery
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Validación: el cirujano principal debe tener rol CIRUJANO
CREATE OR REPLACE FUNCTION validate_surgery_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  surgeon_role user_role;
BEGIN
  SELECT role INTO surgeon_role
  FROM app_user
  WHERE id = NEW.lead_surgeon_id;

  IF surgeon_role IS DISTINCT FROM 'CIRUJANO' THEN
    RAISE EXCEPTION 'lead_surgeon_id no tiene rol CIRUJANO';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_surgery_roles
BEFORE INSERT OR UPDATE ON surgery
FOR EACH ROW EXECUTE FUNCTION validate_surgery_roles();


-- Asistentes por cirugía 

CREATE TABLE surgery_assistant (
  surgery_id UUID NOT NULL REFERENCES surgery(id) ON DELETE CASCADE,
  assistant_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  assistant_role_label VARCHAR(60) NOT NULL DEFAULT 'ASISTENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (surgery_id, assistant_user_id)
);

CREATE INDEX idx_surgery_assistant_user ON surgery_assistant(assistant_user_id);


-- Validación: asistentes válidos
CREATE OR REPLACE FUNCTION validate_assistant_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  r user_role;
BEGIN
  SELECT role INTO r
  FROM app_user
  WHERE id = NEW.assistant_user_id;

  IF r NOT IN ('ASISTENTE', 'CIRUJANO', 'ANESTESIOLOGO') THEN
    RAISE EXCEPTION 'assistant_user_id no tiene rol permitido para asistencia';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_assistant_role
BEFORE INSERT OR UPDATE ON surgery_assistant
FOR EACH ROW EXECUTE FUNCTION validate_assistant_role();

--documentos PDF
CREATE TABLE medical_document (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patient(id) ON DELETE CASCADE,
  surgery_id UUID REFERENCES surgery(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(80) NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  storage_path TEXT NOT NULL,
  sha256 CHAR(64) NOT NULL,
  uploaded_by_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  CONSTRAINT chk_document_target
    CHECK (patient_id IS NOT NULL OR surgery_id IS NOT NULL),
  CONSTRAINT chk_pdf_only
    CHECK (lower(mime_type) = 'application/pdf')
);
CREATE INDEX idx_document_patient ON medical_document(patient_id);
CREATE INDEX idx_document_surgery ON medical_document(surgery_id);
CREATE INDEX idx_document_type ON medical_document(document_type);


--VISTA PARA CALENDARIO
CREATE OR REPLACE VIEW surgery_calendar_view AS
SELECT
  s.id AS surgery_id,
  s.scheduled_start,
  s.scheduled_end,
  (s.scheduled_start AT TIME ZONE 'UTC')::date AS surgery_day_utc,
  s.status,
  s.surgery_type,
  s.operating_room,
  p.id AS patient_id,
  p.first_name || ' ' || p.last_name AS patient_name,
  u.id AS surgeon_id,
  u.first_name || ' ' || u.last_name AS surgeon_name
FROM surgery s
JOIN patient p ON p.id = s.patient_id
JOIN app_user u ON u.id = s.lead_surgeon_id;

--AUDITORIA
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  table_name VARCHAR(80) NOT NULL,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_surgery_request_updated_at
BEFORE UPDATE ON surgery_request
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION validate_anesthesiologist_catalog_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  r user_role;
BEGIN
  SELECT role INTO r
  FROM app_user
  WHERE id = NEW.user_id;

  IF r IS DISTINCT FROM 'ANESTESIOLOGO' THEN
    RAISE EXCEPTION 'user_id % no tiene rol ANESTESIOLOGO', NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_anesthesiologist_catalog_role
BEFORE INSERT OR UPDATE ON anesthesiologist_catalog
FOR EACH ROW EXECUTE FUNCTION validate_anesthesiologist_catalog_role();


-- audita todos los cambios
CREATE OR REPLACE FUNCTION audit_if_modified()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor UUID;
  v_record_id UUID;
  v_details JSONB;
  v_new_row JSONB;
  v_old_row JSONB;
BEGIN
  BEGIN
    v_actor := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
  EXCEPTION WHEN others THEN
    v_actor := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'surgery_assistant' THEN
      v_record_id := NULL;
    ELSE
      v_record_id := NEW.id;
    END IF;

    v_new_row := to_jsonb(NEW);
    IF TG_TABLE_NAME = 'app_user' THEN
      v_new_row := v_new_row - 'password_hash';
    END IF;

    v_details := jsonb_build_object(
      'operation', TG_OP,
      'new', v_new_row
    );

    IF TG_TABLE_NAME = 'surgery_assistant' THEN
      v_details := v_details || jsonb_build_object(
        'keys', jsonb_build_object(
          'surgery_id', NEW.surgery_id,
          'assistant_user_id', NEW.assistant_user_id
        )
      );
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'surgery_assistant' THEN
      v_record_id := NULL;
    ELSE
      v_record_id := NEW.id;
    END IF;

    v_old_row := to_jsonb(OLD);
    v_new_row := to_jsonb(NEW);
    IF TG_TABLE_NAME = 'app_user' THEN
      v_old_row := v_old_row - 'password_hash';
      v_new_row := v_new_row - 'password_hash';
    END IF;

    -- Reduce ruido: no auditar updates donde solo cambie updated_at.
    IF (v_old_row - 'updated_at') = (v_new_row - 'updated_at') THEN
      RETURN NEW;
    END IF;

    v_details := jsonb_build_object(
      'operation', TG_OP,
      'old', v_old_row,
      'new', v_new_row
    );

    IF TG_TABLE_NAME = 'surgery_assistant' THEN
      v_details := v_details || jsonb_build_object(
        'keys', jsonb_build_object(
          'surgery_id', NEW.surgery_id,
          'assistant_user_id', NEW.assistant_user_id
        )
      );
    END IF;
  ELSE
    IF TG_TABLE_NAME = 'surgery_assistant' THEN
      v_record_id := NULL;
    ELSE
      v_record_id := OLD.id;
    END IF;

    v_old_row := to_jsonb(OLD);
    IF TG_TABLE_NAME = 'app_user' THEN
      v_old_row := v_old_row - 'password_hash';
    END IF;

    v_details := jsonb_build_object(
      'operation', TG_OP,
      'old', v_old_row
    );

    IF TG_TABLE_NAME = 'surgery_assistant' THEN
      v_details := v_details || jsonb_build_object(
        'keys', jsonb_build_object(
          'surgery_id', OLD.surgery_id,
          'assistant_user_id', OLD.assistant_user_id
        )
      );
    END IF;
  END IF;

  INSERT INTO audit_log (actor_user_id, action, table_name, record_id, details)
  VALUES (
    v_actor,
    TG_TABLE_NAME || '_' || TG_OP,
    TG_TABLE_NAME,
    v_record_id,
    v_details
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_app_user
AFTER INSERT OR UPDATE OR DELETE ON app_user
FOR EACH ROW EXECUTE FUNCTION audit_if_modified();

CREATE TRIGGER trg_audit_patient
AFTER INSERT OR UPDATE OR DELETE ON patient
FOR EACH ROW EXECUTE FUNCTION audit_if_modified();

CREATE TRIGGER trg_audit_surgery_request
AFTER INSERT OR UPDATE OR DELETE ON surgery_request
FOR EACH ROW EXECUTE FUNCTION audit_if_modified();

CREATE TRIGGER trg_audit_surgery
AFTER INSERT OR UPDATE OR DELETE ON surgery
FOR EACH ROW EXECUTE FUNCTION audit_if_modified();

CREATE TRIGGER trg_audit_surgery_assistant
AFTER INSERT OR UPDATE OR DELETE ON surgery_assistant
FOR EACH ROW EXECUTE FUNCTION audit_if_modified();

CREATE TRIGGER trg_audit_medical_document
AFTER INSERT OR UPDATE OR DELETE ON medical_document
FOR EACH ROW EXECUTE FUNCTION audit_if_modified();