BEGIN;

-- 1) USUARIOS
INSERT INTO app_user (
  id, role, first_name, last_name, email, phone, password_hash, license_number
) VALUES
  ('00000000-0000-0000-0000-000000000001','ADMIN','Ana','Admin','admin@hospital.local','7000-0001','$2b$12$gksZ2ySu97mtIJMI8CMzY.VtZtGJDQBF.fWbT9Mf0w66VfaP.khJy',NULL),
  ('00000000-0000-0000-0000-000000000002','PACIENTE','Carlos','Rojas','carlos.rojas@correo.com','7000-0002','$2b$12$2qfUu08eV4nRDgREhpgUT.JChvuumqN11cyJ7Lims0xxwa2U1Ig4u',NULL),
  ('00000000-0000-0000-0000-000000000003','PACIENTE','Maria','Gomez','maria.gomez@correo.com','7000-0003','$2b$12$kVdmMROIJ63BHxbsRWIM/egLamOfuQCE.ZY7vDMRHWCXTg/NEkbmS',NULL),
  ('00000000-0000-0000-0000-000000000004','CIRUJANO','Laura','Solis','laura.solis@hospital.local','7000-0004','$2b$12$A91FA6nqmrHJNHJbGscTnO6ZL7dtwJQfjukPuU2o44gc.5tKbwVBq','CR-12877'),
  ('00000000-0000-0000-0000-000000000005','ANESTESIOLOGO','Diego','Mora','diego.mora@hospital.local','7000-0005','$2b$12$8JDCCVsecCi8j8ZVsUVi8uYha73jFwXUjzXf/OOtOrauXqN.Vv01m','AN-88421'),
  ('00000000-0000-0000-0000-000000000006','ANESTESIOLOGO','Sofia','Arce','sofia.arce@hospital.local','7000-0006','$2b$12$tWbGd7Cqxz1HD2UA3rwyYOXEN3Pb3YbE19FZorexCyAPJhmVgrr.G','AN-66119'),
  ('00000000-0000-0000-0000-000000000007','ASISTENTE','Jorge','Vega','jorge.vega@hospital.local','7000-0007','$2b$12$adnzfWSftyubzvCY0kJ1TeqX8Z.sNWDGycFnP7OmZf7nAeEwX8LUm',NULL),
  ('00000000-0000-0000-0000-000000000008','ASISTENTE','Elena','Ruiz','elena.ruiz@hospital.local','7000-0008','$2b$12$0BJx6Ql07OiiYedAO34Qu.qCTpips16QIGd9hW9z8JasT.vjdR3xi',NULL)
ON CONFLICT (id) DO NOTHING;
-- admin@hospital.local -> Admin2026!
-- carlos.rojas@correo.com -> CarlosRojas2026!
-- maria.gomez@correo.com -> MariaGomez2026!
-- laura.solis@hospital.local -> LauraSolis2026!
-- diego.mora@hospital.local -> DiegoMora2026!
-- sofia.arce@hospital.local -> SofiaArce2026!
-- jorge.vega@hospital.local -> JorgeVega2026!
-- elena.ruiz@hospital.local -> ElenaRuiz2026!
-- 2) PACIENTES
INSERT INTO patient (
  id, user_id, first_name, last_name, birth_date, sex, identity_document,
  insurance_provider, insurance_policy_numer, emergency_contact_name,
  emergency_contact_phone, medical_notes
) VALUES
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','Carlos','Rojas','1991-03-10','M','ID-CR-1001','Seguro Vida','POL-7788','Luisa Rojas','7011-1111','Alergia leve a penicilina'),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','Maria','Gomez','1988-11-25','F','ID-MG-1002','MediCare Plus','POL-7799','Andres Gomez','7022-2222','Sin antecedentes relevantes')
ON CONFLICT (id) DO NOTHING;

-- 3) CATALOGO DE ANESTESIOLOGOS
INSERT INTO anesthesiologist_catalog (user_id, is_available, notes) VALUES
  ('00000000-0000-0000-0000-000000000005', TRUE, 'Turno manana'),
  ('00000000-0000-0000-0000-000000000006', TRUE, 'Turno tarde')
ON CONFLICT (user_id) DO NOTHING;

-- 4) SOLICITUDES DE CIRUGIA
INSERT INTO surgery_request (
  id, patient_id, requested_by_user_id, requested_date, requested_time,
  surgery_type, reason, priority, status, review_notes
) VALUES
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','2026-04-20','09:00','Apendicectomia','Dolor abdominal recurrente',2,'APROBADA','Aprobada por cirujano'),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','2026-04-22','14:30','Colecistectomia','Colelitiasis sintomatica',3,'EN_REVISION',NULL)
ON CONFLICT (id) DO NOTHING;

-- 5) CIRUGIAS PROGRAMADAS
INSERT INTO surgery (
  id, request_id, patient_id, lead_surgeon_id, anesthesiologist_id,
  surgery_type, status, scheduled_start, scheduled_end, operating_room,
  preop_notes, created_by_user_id
) VALUES
  ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000005',
   'Apendicectomia','PROGRAMADA','2026-04-25 13:00:00+00','2026-04-25 15:00:00+00','QX-01',
   'Ayuno 8h, laboratorios en rango','00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 6) ASISTENTES POR CIRUGIA
INSERT INTO surgery_assistant (surgery_id, assistant_user_id, assistant_role_label) VALUES
  ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000007','Instrumentista'),
  ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000008','Circulante')
ON CONFLICT (surgery_id, assistant_user_id) DO NOTHING;

-- 7) DOCUMENTOS MEDICOS (PDF)
INSERT INTO medical_document (
  id, patient_id, surgery_id, document_type, file_name, mime_type,
  file_size_bytes, storage_path, sha256, uploaded_by_user_id, notes
) VALUES
  ('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',NULL,
   'POLIZA_SEGURO','poliza_carlos.pdf','application/pdf',245901,
   '/secure/patients/10000000-0000-0000-0000-000000000001/poliza_carlos.pdf',
   'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '00000000-0000-0000-0000-000000000002','Documento de cobertura vigente'),
  ('40000000-0000-0000-0000-000000000002',NULL,'30000000-0000-0000-0000-000000000001',
   'CONSENTIMIENTO_INFORMADO','consentimiento_apendicectomia.pdf','application/pdf',180045,
   '/secure/surgeries/30000000-0000-0000-0000-000000000001/consentimiento.pdf',
   'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
   '00000000-0000-0000-0000-000000000004','Firmado por paciente y cirujano')
ON CONFLICT (id) DO NOTHING;

-- 8) AUDITORIA INICIAL
INSERT INTO audit_log (actor_user_id, action, table_name, record_id, details) VALUES
  ('00000000-0000-0000-0000-000000000001','SEED_INSERT','app_user',NULL,'{"batch":"initial_seed"}'::jsonb),
  ('00000000-0000-0000-0000-000000000001','SEED_INSERT','patient',NULL,'{"batch":"initial_seed"}'::jsonb);

COMMIT;