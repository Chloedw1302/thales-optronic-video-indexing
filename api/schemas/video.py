"""
Video-related schemas for request and response validation.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class VideoUploadResponse(BaseModel):
    """Response after uploading a video."""
    video_id: str
    filename: str
    status: str
    has_voice_file: bool
    interval_seconds: int
    message: str

    @field_validator('video_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string."""
        return str(v) if isinstance(v, UUID) else v


class VideoStatus(BaseModel):
    """Processing status information."""
    video_id: str
    status: str
    progress_percentage: Optional[float] = None
    current_stage: Optional[str] = None
    progress_message: Optional[str] = None
    error_message: Optional[str] = None

    @field_validator('video_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string."""
        return str(v) if isinstance(v, UUID) else v


class VideoDetail(BaseModel):
    """Detailed video information."""
    id: str
    filename: str
    original_filename: str
    video_path: str
    voice_path: Optional[str] = None
    interval_seconds: int
    has_voice_file: bool
    status: str
    current_stage: Optional[str] = None
    progress_percentage: Optional[float] = None
    progress_message: Optional[str] = None
    report_path: Optional[str] = None
    frames_directory: Optional[str] = None
    duration_seconds: Optional[float] = None
    total_frames_analyzed: Optional[int] = None
    unique_entities_count: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string."""
        return str(v) if isinstance(v, UUID) else v

    class Config:
        from_attributes = True


class VideoSummary(BaseModel):
    """Summary video information for list views."""
    id: str
    filename: str
    status: str
    has_voice_file: bool
    duration_seconds: Optional[float] = None
    total_frames_analyzed: Optional[int] = None
    unique_entities_count: Optional[int] = None
    created_at: datetime
    processed_at: Optional[datetime] = None

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string."""
        return str(v) if isinstance(v, UUID) else v

    class Config:
        from_attributes = True


class VideoList(BaseModel):
    """Paginated list of videos."""
    videos: List[VideoSummary]
    total: int
    page: int
    limit: int
    total_pages: int


class FrameInfo(BaseModel):
    """Information about a single frame."""
    frame_number: int
    timestamp: float
    frame_path: str
    entities_detected: List[str] = []


class VideoReport(BaseModel):
    """Video processing report."""
    video_id: str
    filename: str
    duration_seconds: float
    total_frames_analyzed: int
    interval_seconds: int
    unique_entities: List[str]
    entity_appearances: Dict[str, Any]
    timeline: List[Dict[str, Any]]
    statistics: Dict[str, Any]

    @field_validator('video_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string."""
        return str(v) if isinstance(v, UUID) else v


class ProcessVideoRequest(BaseModel):
    """Request to process a video."""
    interval_seconds: Optional[int] = Field(default=5, ge=1, le=60)


class DeleteVideoResponse(BaseModel):
    """Response after deleting a video."""
    success: bool
    message: str
    video_id: str

    @field_validator('video_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string."""
        return str(v) if isinstance(v, UUID) else v
