"""
SQLAlchemy models for entity detection and search.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship

from api.database import Base
from api.models.video import GUID


class Entity(Base):
    """Entity model for storing unique entity types detected across videos."""

    __tablename__ = "entities"

    # Primary identification
    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    category = Column(String(100), nullable=True)  # Future enhancement: categorize entities

    # Embeddings for semantic search
    embedding = Column(Text, nullable=True)  # JSON array of floats (1024-dimensional vector)
    embedding_model = Column(String(50), nullable=True, default="mistral-embed")
    embedding_generated_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    video_detections = relationship("VideoEntityDetection", back_populates="entity", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Entity(id={self.id}, name={self.name})>"

    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": str(self.id),
            "name": self.name,
            "category": self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class VideoEntityDetection(Base):
    """Junction table linking videos to detected entities with statistics."""

    __tablename__ = "video_entity_detections"

    # Primary identification
    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    video_id = Column(GUID(), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    entity_id = Column(GUID(), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)

    # Detection statistics
    frames_with_entity = Column(Integer, nullable=False)
    total_frames_analyzed = Column(Integer, nullable=False)
    presence_percentage = Column(Float, nullable=False)  # Calculated: (frames_with_entity / total_frames_analyzed) * 100

    # Temporal information (JSON stored as text)
    time_ranges = Column(Text, nullable=True)  # JSON array of [start, end] time ranges in seconds
    first_appearance_second = Column(Float, nullable=True)
    last_appearance_second = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    entity = relationship("Entity", back_populates="video_detections")

    # Composite indexes for performance
    __table_args__ = (
        Index('ix_video_entity_lookup', 'video_id', 'entity_id'),
        Index('ix_entity_presence', 'entity_id', 'presence_percentage'),
        Index('ix_entity_video_presence', 'entity_id', 'presence_percentage', 'frames_with_entity'),
    )

    def __repr__(self):
        return f"<VideoEntityDetection(video_id={self.video_id}, entity_id={self.entity_id}, presence={self.presence_percentage}%)>"

    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": str(self.id),
            "video_id": str(self.video_id),
            "entity_id": str(self.entity_id),
            "entity_name": self.entity.name if self.entity else None,
            "frames_with_entity": self.frames_with_entity,
            "total_frames_analyzed": self.total_frames_analyzed,
            "presence_percentage": self.presence_percentage,
            "time_ranges": self.time_ranges,
            "first_appearance_second": self.first_appearance_second,
            "last_appearance_second": self.last_appearance_second,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
