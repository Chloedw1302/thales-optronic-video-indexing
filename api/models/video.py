"""
SQLAlchemy models for video records.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from api.database import Base


class GUID(TypeDecorator):
    """Platform-independent GUID type.

    Uses PostgreSQL's UUID type, otherwise uses CHAR(32), storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return "%.32x" % uuid.UUID(value).int
            else:
                return "%.32x" % value.int

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                value = uuid.UUID(value)
            return value


class Video(Base):
    """Video model for storing video metadata and processing status."""

    __tablename__ = "videos"

    # Primary identification
    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)

    # File paths
    video_path = Column(String(512), nullable=False)
    voice_path = Column(String(512), nullable=True)

    # Processing configuration
    interval_seconds = Column(Integer, nullable=False, default=5)
    has_voice_file = Column(Boolean, nullable=False, default=False)

    # Processing status
    status = Column(
        String(50),
        nullable=False,
        default="uploaded",
        index=True
    )  # uploaded, processing, completed, failed

    # Progress tracking
    current_stage = Column(String(100), nullable=True)
    progress_percentage = Column(Float, nullable=True, default=0.0)
    progress_message = Column(String(512), nullable=True)

    # Output paths
    report_path = Column(String(512), nullable=True)
    frames_directory = Column(String(512), nullable=True)

    # Processing results
    duration_seconds = Column(Float, nullable=True)
    total_frames_analyzed = Column(Integer, nullable=True)
    unique_entities_count = Column(Integer, nullable=True)

    # Error handling
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    # Relationships
    entity_detections = relationship("VideoEntityDetection", backref="video", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Video(id={self.id}, filename={self.filename}, status={self.status})>"

    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": str(self.id),
            "filename": self.filename,
            "original_filename": self.original_filename,
            "video_path": self.video_path,
            "voice_path": self.voice_path,
            "interval_seconds": self.interval_seconds,
            "has_voice_file": self.has_voice_file,
            "status": self.status,
            "current_stage": self.current_stage,
            "progress_percentage": self.progress_percentage,
            "progress_message": self.progress_message,
            "report_path": self.report_path,
            "frames_directory": self.frames_directory,
            "duration_seconds": self.duration_seconds,
            "total_frames_analyzed": self.total_frames_analyzed,
            "unique_entities_count": self.unique_entities_count,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
        }
