"""
Background tasks for video processing.
"""
import logging
from sqlalchemy.orm import Session

from api.services.processing_service import processing_service
from api.database import SessionLocal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def process_video_task(video_id: str) -> None:
    """
    Background task to process a video.

    This function runs in the background using FastAPI's BackgroundTasks.
    It creates its own database session and processes the video through
    the detection pipeline.

    Args:
        video_id: ID of the video to process
    """
    logger.info(f"Starting background processing for video {video_id}")

    # Create a new database session for this task
    db = SessionLocal()

    try:
        # Process the video
        success = processing_service.process_video(video_id, db)

        if success:
            logger.info(f"Successfully processed video {video_id}")
        else:
            logger.error(f"Failed to process video {video_id}")

    except Exception as e:
        logger.error(f"Exception during processing of video {video_id}: {str(e)}")

    finally:
        # Always close the database session
        db.close()
