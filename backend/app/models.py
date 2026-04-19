from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, Enum, CheckConstraint, Index, func, UUID, BigInteger, SmallInteger, Time, Date
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    PACIENTE = "PACIENTE"
    CIRUJANO = "CIRUJANO"
    ANESTESIOLOGO = "ANESTESIOLOGO"
    ASISTENTE = "ASISTENTE"

class RequestStatus(str, enum.Enum):
    BORRADOR = "BORRADOR"
    ENVIADA = "ENVIADA"
    EN_REVISION = "EN_REVISION"
    APROBADA = "APROBADA"
    RECHAZADA = "RECHAZADA"
    CANCELADA = "CANCELADA"

class SurgeryStatus(str, enum.Enum):
    SOLICITADA = "SOLICITADA"
    PENDIENTE_VALIDACION = "PENDIENTE_VALIDACION"
    PROGRAMADA = "PROGRAMADA"
    EN_CURSO = "EN_CURSO"
    COMPLETADA = "COMPLETADA"
    CANCELADA = "CANCELADA"

class DocumentType(str, enum.Enum):
    POLIZA_SEGURO = "POLIZA_SEGURO"
    NOTA_MEDICA = "NOTA_MEDICA"
    CONSENTIMIENTO_INFORMADO = "CONSENTIMIENTO_INFORMADO"
    EXAMEN_PREOP = "EXAMEN_PREOP"
    OTRO = "OTRO"

class AppUser(Base):
    __tablename__ = "app_user"
    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    role = Column(Enum(UserRole), nullable=False)
    first_name = Column(String(80))
    last_name = Column(String(80))
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(30))
    password_hash = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now())
    license_number = Column(String(60))

    # Relationships
    patient = relationship("Patient", uselist=False)

class Patient(Base):
    __tablename__ = "patient"
    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("app_user.id"), unique=True)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    birth_date = Column(Date, nullable=False)
    sex = Column(String(20))
    identity_document = Column(String(50), unique=True)
    insurance_provider = Column(String(120))
    insurance_policy_numer = Column(String(80))
    emergency_contact_name = Column(String(120))
    emergency_contact_phone = Column(String(30))
    medical_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now())

class AnesthesiologistCatalog(Base):
    __tablename__ = "anesthesiologist_catalog"
    user_id = Column(UUID(as_uuid=True), ForeignKey("app_user.id"), primary_key=True)
    is_available = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=func.now())

class SurgeryRequest(Base):
    __tablename__ = "surgery_request"
    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patient.id"), nullable=False)
    requested_by_user_id = Column(UUID(as_uuid=True), ForeignKey("app_user.id"))
    requested_date = Column(Date, nullable=False)
    requested_time = Column(Time)
    surgery_type = Column(String(120), nullable=False)
    reason = Column(Text)
    priority = Column(SmallInteger, default=3)
    status = Column(Enum(RequestStatus), default=RequestStatus.ENVIADA)
    reviewed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("app_user.id"))
    reviewed_at = Column(DateTime(timezone=True))
    review_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now())

class Surgery(Base):
    __tablename__ = "surgery"
    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    request_id = Column(UUID(as_uuid=True), ForeignKey("surgery_request.id"), unique=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patient.id"), nullable=False)
    lead_surgeon_id = Column(UUID(as_uuid=True), ForeignKey("app_user.id"), nullable=False)
    anesthesiologist_id = Column(UUID(as_uuid=True), ForeignKey("anesthesiologist_catalog.user_id"), nullable=False)
    surgery_type = Column(String(120), nullable=False)
    status = Column(Enum(SurgeryStatus), default=SurgeryStatus.PROGRAMADA)
    scheduled_start = Column(DateTime(timezone=True), nullable=False)
    scheduled_end = Column(DateTime(timezone=True), nullable=False)
    operating_room = Column(String(30))
    preop_notes = Column(Text)
    postop_notes = Column(Text)
    cancellation_reason = Column(Text)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("app_user.id"))
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now())

    # Relationships
    patient = relationship("Patient")
    lead_surgeon = relationship("AppUser", foreign_keys=[lead_surgeon_id])
    surgery_assistants = relationship("SurgeryAssistant")

class SurgeryAssistant(Base):
    __tablename__ = "surgery_assistant"
    surgery_id = Column(UUID(as_uuid=True), ForeignKey("surgery.id"), primary_key=True)
    assistant_user_id = Column(UUID(as_uuid=True), ForeignKey("app_user.id"), primary_key=True)
    assistant_role_label = Column(String(60), default="ASISTENTE")
    created_at = Column(DateTime(timezone=True), default=func.now())

    # Relationships
    assistant = relationship("AppUser", foreign_keys=[assistant_user_id])

class MedicalDocument(Base):
    __tablename__ = "medical_document"
    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patient.id"))
    surgery_id = Column(UUID(as_uuid=True), ForeignKey("surgery.id"))
    document_type = Column(Enum(DocumentType), nullable=False)
    file_name = Column(String(255), nullable=False)
    mime_type = Column(String(80), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    storage_path = Column(Text, nullable=False)
    sha256 = Column(String(64), nullable=False)
    uploaded_by_user_id = Column(UUID(as_uuid=True), ForeignKey("app_user.id"))
    uploaded_at = Column(DateTime(timezone=True), default=func.now())
    notes = Column(Text)

    # Relationships
    surgery = relationship("Surgery")

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    actor_user_id = Column(UUID(as_uuid=True), ForeignKey("app_user.id"))
    action = Column(String(80), nullable=False)
    table_name = Column(String(80), nullable=False)
    record_id = Column(UUID(as_uuid=True))
    details = Column(JSONB)
    created_at = Column(DateTime(timezone=True), default=func.now())