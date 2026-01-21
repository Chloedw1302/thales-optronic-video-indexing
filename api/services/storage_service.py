"""
Storage service for handling file operations.
"""
import os
import shutil
from pathlib import Path
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException

from api.config import settings


class StorageService:
    """Service for managing file storage operations."""

    @staticmethod
    def validate_video_file(file: UploadFile) -> Tuple[bool, Optional[str]]:
        """
        Validate video file type and size.

        Args:
            file: Uploaded video file

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in settings.allowed_video_extensions:
            return False, f"Invalid video file type. Allowed: {', '.join(settings.allowed_video_extensions)}"

        # Check file size (if available)
        if hasattr(file, 'size') and file.size:
            max_size_bytes = settings.max_video_size_mb * 1024 * 1024
            if file.size > max_size_bytes:
                return False, f"Video file too large. Maximum size: {settings.max_video_size_mb}MB"

        return True, None

    @staticmethod
    def validate_voice_file(file: UploadFile) -> Tuple[bool, Optional[str]]:
        """
        Validate voice file type and size.

        Args:
            file: Uploaded voice file

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in settings.allowed_voice_extensions:
            return False, f"Invalid voice file type. Allowed: {', '.join(settings.allowed_voice_extensions)}"

        # Check file size (if available)
        if hasattr(file, 'size') and file.size:
            max_size_bytes = settings.max_voice_file_size_mb * 1024 * 1024
            if file.size > max_size_bytes:
                return False, f"Voice file too large. Maximum size: {settings.max_voice_file_size_mb}MB"

        return True, None

    @staticmethod
    async def save_uploaded_file(
        video_id: str,
        file: UploadFile,
        file_type: str = "video"
    ) -> str:
        """
        Save uploaded file to storage.

        Args:
            video_id: Video ID for organizing files
            file: Uploaded file
            file_type: Type of file ('video' or 'voice')

        Returns:
            Path to saved file

        Raises:
            HTTPException: If file cannot be saved
        """
        try:
            # Create video directory
            video_dir = settings.uploads_dir / video_id
            video_dir.mkdir(parents=True, exist_ok=True)

            # Determine filename
            if file_type == "video":
                file_ext = Path(file.filename).suffix
                filename = f"video{file_ext}"
            else:
                filename = "voice.txt"

            # Save file
            file_path = video_dir / filename
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)

            return str(file_path)

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save {file_type} file: {str(e)}"
            )

    @staticmethod
    def get_video_path(video_id: str) -> Optional[str]:
        """
        Get path to video file.

        Args:
            video_id: Video ID

        Returns:
            Path to video file or None if not found
        """
        video_dir = settings.uploads_dir / video_id
        if not video_dir.exists():
            return None

        for ext in settings.allowed_video_extensions:
            video_path = video_dir / f"video{ext}"
            if video_path.exists():
                return str(video_path)

        return None

    @staticmethod
    def get_voice_path(video_id: str) -> Optional[str]:
        """
        Get path to voice file.

        Args:
            video_id: Video ID

        Returns:
            Path to voice file or None if not found
        """
        voice_path = settings.uploads_dir / video_id / "voice.txt"
        if voice_path.exists():
            return str(voice_path)
        return None

    @staticmethod
    def get_report_path(video_id: str) -> Optional[str]:
        """
        Get path to report file.

        Args:
            video_id: Video ID

        Returns:
            Path to report file or None if not found
        """
        report_path = settings.processed_dir / video_id / "report.json"
        if report_path.exists():
            return str(report_path)
        return None

    @staticmethod
    def get_frames_directory(video_id: str) -> str:
        """
        Get path to frames directory.

        Args:
            video_id: Video ID

        Returns:
            Path to frames directory
        """
        frames_dir = settings.processed_dir / video_id / "frames"
        frames_dir.mkdir(parents=True, exist_ok=True)
        return str(frames_dir)

    @staticmethod
    def get_processed_directory(video_id: str) -> str:
        """
        Get path to processed directory for a video.

        Args:
            video_id: Video ID

        Returns:
            Path to processed directory
        """
        processed_dir = settings.processed_dir / video_id
        processed_dir.mkdir(parents=True, exist_ok=True)
        return str(processed_dir)

    @staticmethod
    def delete_video_files(video_id: str) -> bool:
        """
        Delete all files associated with a video.

        Args:
            video_id: Video ID

        Returns:
            True if files were deleted, False if no files found
        """
        deleted = False

        # Delete uploads directory
        uploads_dir = settings.uploads_dir / video_id
        if uploads_dir.exists():
            shutil.rmtree(uploads_dir)
            deleted = True

        # Delete processed directory
        processed_dir = settings.processed_dir / video_id
        if processed_dir.exists():
            shutil.rmtree(processed_dir)
            deleted = True

        return deleted

    @staticmethod
    def list_frames(video_id: str) -> list:
        """
        List all frames for a video.

        Args:
            video_id: Video ID

        Returns:
            List of frame file paths
        """
        frames_dir = settings.processed_dir / video_id / "frames"
        if not frames_dir.exists():
            return []

        frames = []
        for frame_file in sorted(frames_dir.glob("frame_*.jpg")):
            frames.append(str(frame_file))

        return frames

    @staticmethod
    def get_frame_path(video_id: str, frame_number: int) -> Optional[str]:
        """
        Get path to a specific frame.

        Args:
            video_id: Video ID
            frame_number: Frame number (sequential index)

        Returns:
            Path to frame file or None if not found
        """
        # Get the video's interval_seconds from database to map frame_number to timestamp
        from api.database import SessionLocal
        from api.models.video import Video
        
        db = SessionLocal()
        try:
            video = db.query(Video).filter(Video.id == video_id).first()
            if video and video.interval_seconds:
                # Calculate the timestamp for this frame number
                timestamp = frame_number * video.interval_seconds
                frame_path = settings.processed_dir / video_id / "frames" / f"frame_{timestamp:05d}.jpg"
                if frame_path.exists():
                    return str(frame_path)
            
            # Fallback: try the original method for compatibility
            frame_path = settings.processed_dir / video_id / "frames" / f"frame_{frame_number:05d}.jpg"
            if frame_path.exists():
                return str(frame_path)
            
            return None
        finally:
            db.close()


# Create singleton instance
storage_service = StorageService()
