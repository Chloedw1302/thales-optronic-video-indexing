"""
Processing service for integrating with the Thales video indexing pipeline.
"""
import json
import os
import cv2
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from thales.entity_detector import process_video_with_voice, detect_entities_in_video
from thales.report_generator import generate_report
from thales.video_processor import extract_frames_at_intervals, get_video_duration
from thales.config import ENTITY_CATEGORIES

from api.models.video import Video
from api.services.storage_service import storage_service


class ProcessingService:
    """Service for processing videos through the detection pipeline."""

    @staticmethod
    def update_progress(
        db: Session,
        video: Video,
        stage: str,
        percentage: float,
        message: Optional[str] = None
    ) -> None:
        """
        Update video processing progress in database.

        Args:
            db: Database session
            video: Video model instance
            stage: Current processing stage
            percentage: Progress percentage (0-100)
            message: Optional progress message
        """
        video.current_stage = stage
        video.progress_percentage = percentage
        if message:
            video.progress_message = message
        db.commit()

    @staticmethod
    def save_frames_to_disk(
        video_id: str,
        frames: list,
        video_path: str
    ) -> str:
        """
        Save extracted frames to disk.

        Args:
            video_id: Video ID
            frames: List of (second, frame) tuples
            video_path: Path to video file

        Returns:
            Path to frames directory
        """
        frames_dir = storage_service.get_frames_directory(video_id)

        for i, (second, frame) in enumerate(frames):
            frame_filename = f"frame_{second:05d}.jpg"
            frame_path = Path(frames_dir) / frame_filename
            cv2.imwrite(str(frame_path), frame)

        return frames_dir

    @staticmethod
    def process_video(video_id: str, db: Session) -> bool:
        """
        Process a video through the detection pipeline.

        Args:
            video_id: Video ID to process
            db: Database session

        Returns:
            True if processing succeeded, False otherwise
        """
        # Get video from database
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            print(f"Video {video_id} not found in database")
            return False

        try:
            # Update status to processing
            video.status = "processing"
            video.progress_percentage = 0.0
            video.current_stage = "Initializing"
            video.progress_message = "Starting video processing"
            db.commit()

            print(f"Processing video: {video.filename}")
            print(f"Video path: {video.video_path}")
            print(f"Voice path: {video.voice_path}")
            print(f"Interval: {video.interval_seconds} seconds")

            # Get video duration
            ProcessingService.update_progress(
                db, video, "Analyzing video", 5.0,
                "Getting video information"
            )
            duration = get_video_duration(video.video_path)
            video.duration_seconds = duration
            db.commit()

            # Detect entities
            detection_results = None

            if video.voice_path and os.path.exists(video.voice_path):
                # Process with voice file
                ProcessingService.update_progress(
                    db, video, "Extracting entities from voice", 10.0,
                    "Analyzing voice file for entities"
                )

                print("Processing with voice file...")
                detection_results = process_video_with_voice(
                    video_path=video.video_path,
                    voice_file_path=video.voice_path,
                    interval_seconds=video.interval_seconds
                )

                ProcessingService.update_progress(
                    db, video, "Detecting entities in frames", 50.0,
                    "Analyzing video frames"
                )

            else:
                # Process without voice file - use default categories
                ProcessingService.update_progress(
                    db, video, "Detecting entities in frames", 20.0,
                    "Analyzing video frames (no voice file)"
                )

                print("Processing without voice file - using default entity categories")
                # Use default entity categories for visual detection
                entity_to_category = {cat: cat for cat in ENTITY_CATEGORIES}

                detection_results = detect_entities_in_video(
                    video_path=video.video_path,
                    entities=ENTITY_CATEGORIES,
                    entity_to_category=entity_to_category,
                    interval_seconds=video.interval_seconds
                )

                ProcessingService.update_progress(
                    db, video, "Entity detection complete", 70.0,
                    "Frame analysis complete"
                )

            if not detection_results:
                raise ValueError("No detection results generated")

            # Extract and save frames
            ProcessingService.update_progress(
                db, video, "Saving frames", 75.0,
                "Extracting and saving video frames"
            )

            print("Extracting frames...")
            frames = extract_frames_at_intervals(
                video.video_path,
                video.interval_seconds
            )

            frames_dir = ProcessingService.save_frames_to_disk(
                str(video.id),
                frames,
                video.video_path
            )
            video.frames_directory = frames_dir
            video.total_frames_analyzed = len(frames)
            db.commit()

            # Generate report
            ProcessingService.update_progress(
                db, video, "Generating report", 85.0,
                "Creating detection report"
            )

            print("Generating report...")
            processed_dir = storage_service.get_processed_directory(str(video.id))
            report_path = Path(processed_dir) / "report.json"

            report = generate_report(
                video_path=video.video_path,
                detection_results=detection_results,
                output_path=str(report_path)
            )

            video.report_path = str(report_path)

            # Extract statistics from report
            if report and "entities" in report:
                video.unique_entities_count = len([
                    entity for entity, data in report["entities"].items()
                    if data.get("statistics", {}).get("frames_with_entity", 0) > 0
                ])

            db.commit()

            # Mark as completed
            ProcessingService.update_progress(
                db, video, "Complete", 100.0,
                "Video processing complete"
            )

            video.status = "completed"
            video.processed_at = datetime.utcnow()
            video.error_message = None
            db.commit()

            print(f"Processing complete for video {video_id}")
            return True

        except Exception as e:
            print(f"Error processing video {video_id}: {str(e)}")

            # Update video with error
            video.status = "failed"
            video.error_message = str(e)
            video.progress_percentage = 0.0
            video.current_stage = "Failed"
            video.progress_message = f"Processing failed: {str(e)}"
            db.commit()

            return False


# Create singleton instance
processing_service = ProcessingService()
