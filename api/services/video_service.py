"""
Video service for managing video records in the database.
"""
import uuid
from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session

from api.models.video import Video
from api.services.storage_service import storage_service


class VideoService:
    """Service for managing video database operations."""

    @staticmethod
    def create_video(
        db: Session,
        filename: str,
        original_filename: str,
        video_path: str,
        voice_path: Optional[str],
        interval_seconds: int
    ) -> Video:
        """
        Create a new video record in the database.

        Args:
            db: Database session
            filename: Internal filename
            original_filename: Original uploaded filename
            video_path: Path to video file
            voice_path: Optional path to voice file
            interval_seconds: Frame extraction interval

        Returns:
            Created Video instance
        """
        video = Video(
            id=uuid.uuid4(),
            filename=filename,
            original_filename=original_filename,
            video_path=video_path,
            voice_path=voice_path,
            interval_seconds=interval_seconds,
            has_voice_file=bool(voice_path),
            status="uploaded",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(video)
        db.commit()
        db.refresh(video)

        return video

    @staticmethod
    def get_video(db: Session, video_id: str) -> Optional[Video]:
        """
        Get a video by ID.

        Args:
            db: Database session
            video_id: Video ID

        Returns:
            Video instance or None if not found
        """
        return db.query(Video).filter(Video.id == video_id).first()

    @staticmethod
    def list_videos(
        db: Session,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
        sort_by: str = "created_at",
        order: str = "desc"
    ) -> Tuple[List[Video], int]:
        """
        List videos with filtering and pagination.

        Args:
            db: Database session
            status: Optional status filter
            page: Page number (1-indexed)
            limit: Items per page
            sort_by: Field to sort by
            order: Sort order ('asc' or 'desc')

        Returns:
            Tuple of (videos list, total count)
        """
        query = db.query(Video)

        # Apply status filter
        if status:
            query = query.filter(Video.status == status)

        # Get total count
        total = query.count()

        # Apply sorting
        sort_column = getattr(Video, sort_by, Video.created_at)
        if order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Apply pagination
        offset = (page - 1) * limit
        videos = query.offset(offset).limit(limit).all()

        return videos, total

    @staticmethod
    def update_video_status(
        db: Session,
        video_id: str,
        status: str,
        error_message: Optional[str] = None
    ) -> Optional[Video]:
        """
        Update video processing status.

        Args:
            db: Database session
            video_id: Video ID
            status: New status
            error_message: Optional error message

        Returns:
            Updated Video instance or None if not found
        """
        video = db.query(Video).filter(Video.id == video_id).first()

        if video:
            video.status = status
            video.updated_at = datetime.utcnow()

            if status == "completed":
                video.processed_at = datetime.utcnow()
                video.error_message = None
            elif status == "failed" and error_message:
                video.error_message = error_message

            db.commit()
            db.refresh(video)

        return video

    @staticmethod
    def delete_video(
        db: Session,
        video_id: str,
        delete_files: bool = True
    ) -> bool:
        """
        Delete a video record and optionally its files.

        Args:
            db: Database session
            video_id: Video ID
            delete_files: Whether to delete associated files

        Returns:
            True if deleted, False if not found
        """
        video = db.query(Video).filter(Video.id == video_id).first()

        if not video:
            return False

        # Delete files if requested
        if delete_files:
            storage_service.delete_video_files(video_id)

        # Delete database record
        db.delete(video)
        db.commit()

        return True

    @staticmethod
    def get_video_statistics(db: Session) -> dict:
        """
        Get statistics about videos in the database.

        Args:
            db: Database session

        Returns:
            Dictionary with statistics
        """
        total_videos = db.query(func.count(Video.id)).scalar()

        status_counts = {}
        for status in ["uploaded", "processing", "completed", "failed"]:
            count = db.query(func.count(Video.id)).filter(Video.status == status).scalar()
            status_counts[status] = count

        return {
            "total_videos": total_videos,
            "status_counts": status_counts
        }


# Create singleton instance
video_service = VideoService()
