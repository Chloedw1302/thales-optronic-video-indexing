"""
API routes for video operations.
"""
import json
import math
from typing import Optional
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from api.database import get_db
from api.config import settings
from api.models.video import Video
from api.schemas import (
    VideoUploadResponse,
    VideoStatus,
    VideoDetail,
    VideoSummary,
    VideoList,
    VideoReport,
    DeleteVideoResponse,
    FrameInfo,
)
from api.services import storage_service, video_service, processing_service
from api.tasks import process_video_task

router = APIRouter(prefix="/api/v1/videos", tags=["videos"])


@router.post("/upload", response_model=VideoUploadResponse, status_code=201)
async def upload_video(
    background_tasks: BackgroundTasks,
    video_file: UploadFile = File(..., description="Video file to upload"),
    voice_file: Optional[UploadFile] = File(None, description="Optional voice transcript file"),
    interval_seconds: int = Form(default=5, ge=1, le=60, description="Frame extraction interval"),
    process_immediately: bool = Form(default=True, description="Start processing immediately"),
    db: Session = Depends(get_db)
):
    """
    Upload a video file and optionally a voice transcript.

    - **video_file**: Video file (.mkv, .mp4, .avi, .mov)
    - **voice_file**: Optional voice transcript (.txt)
    - **interval_seconds**: Interval for frame extraction (1-60 seconds)
    - **process_immediately**: Whether to start processing right away
    """
    # Validate video file
    is_valid, error_msg = storage_service.validate_video_file(video_file)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # Validate voice file if provided
    if voice_file:
        is_valid, error_msg = storage_service.validate_voice_file(voice_file)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

    # Create video record
    video = video_service.create_video(
        db=db,
        filename=f"video_{video_file.filename}",
        original_filename=video_file.filename,
        video_path="",  # Will be set after saving
        voice_path=None,
        interval_seconds=interval_seconds
    )

    try:
        # Save video file
        video_path = await storage_service.save_uploaded_file(
            str(video.id), video_file, "video"
        )
        video.video_path = video_path

        # Save voice file if provided
        if voice_file:
            voice_path = await storage_service.save_uploaded_file(
                str(video.id), voice_file, "voice"
            )
            video.voice_path = voice_path
            video.has_voice_file = True

        db.commit()

        # Start processing if requested
        if process_immediately:
            background_tasks.add_task(process_video_task, str(video.id))
            message = "Video uploaded successfully. Processing started."
        else:
            message = "Video uploaded successfully. Call /process to start processing."

        return VideoUploadResponse(
            video_id=str(video.id),
            filename=video.filename,
            status=video.status,
            has_voice_file=video.has_voice_file,
            interval_seconds=video.interval_seconds,
            message=message
        )

    except Exception as e:
        # Clean up if something goes wrong
        video_service.delete_video(db, str(video.id), delete_files=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload video: {str(e)}")


@router.get("", response_model=VideoList)
def list_videos(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "created_at",
    order: str = "desc",
    db: Session = Depends(get_db)
):
    """
    List all videos with optional filtering and pagination.

    - **status**: Filter by status (uploaded, processing, completed, failed)
    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 20)
    - **sort_by**: Field to sort by (default: created_at)
    - **order**: Sort order (asc/desc, default: desc)
    """
    videos, total = video_service.list_videos(
        db=db,
        status=status,
        page=page,
        limit=limit,
        sort_by=sort_by,
        order=order
    )

    total_pages = math.ceil(total / limit) if limit > 0 else 0

    return VideoList(
        videos=[VideoSummary.model_validate(v) for v in videos],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@router.get("/{video_id}", response_model=VideoDetail)
def get_video(video_id: str, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific video.
    """
    video = video_service.get_video(db, video_id)

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return VideoDetail.model_validate(video)


@router.get("/{video_id}/status", response_model=VideoStatus)
def get_video_status(video_id: str, db: Session = Depends(get_db)):
    """
    Get the current processing status of a video.
    Useful for polling progress updates.
    """
    video = video_service.get_video(db, video_id)

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return VideoStatus(
        video_id=str(video.id),
        status=video.status,
        progress_percentage=video.progress_percentage,
        current_stage=video.current_stage,
        progress_message=video.progress_message,
        error_message=video.error_message
    )


@router.post("/{video_id}/process", response_model=VideoStatus)
def process_video(
    video_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Trigger processing for an uploaded video.
    """
    video = video_service.get_video(db, video_id)

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if video.status == "processing":
        raise HTTPException(status_code=400, detail="Video is already being processed")

    if video.status == "completed":
        raise HTTPException(status_code=400, detail="Video has already been processed")

    # Start background processing
    background_tasks.add_task(process_video_task, video_id)

    return VideoStatus(
        video_id=video_id,
        status="processing",
        progress_percentage=0.0,
        current_stage="Queued",
        progress_message="Processing started",
        error_message=None
    )


@router.get("/{video_id}/report", response_model=VideoReport)
def get_video_report(video_id: str, db: Session = Depends(get_db)):
    """
    Get the detection report for a processed video.
    """
    video = video_service.get_video(db, video_id)

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if video.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Video has not been processed yet. Current status: {video.status}"
        )

    if not video.report_path or not Path(video.report_path).exists():
        raise HTTPException(status_code=404, detail="Report file not found")

    try:
        with open(video.report_path, 'r') as f:
            report_data = json.load(f)

        # Extract relevant information
        unique_entities = []
        entity_appearances = {}
        timeline = []
        statistics = {}

        if "entities" in report_data:
            for entity_name, entity_data in report_data["entities"].items():
                if entity_data.get("statistics", {}).get("frames_with_entity", 0) > 0:
                    unique_entities.append(entity_name)
                    # Add count field to match frontend expectations
                    entity_data_with_count = entity_data.copy()
                    entity_data_with_count["count"] = entity_data.get("statistics", {}).get("frames_with_entity", 0)
                    entity_appearances[entity_name] = entity_data_with_count

        if "timeline" in report_data:
            timeline = report_data["timeline"]

        if "statistics" in report_data:
            statistics = report_data["statistics"]
        
        # Build consolidated timeline data for visualization
        consolidated_timeline = []
        if "entities" in report_data:
            for entity_name, entity_data in report_data["entities"].items():
                if entity_data.get("time_ranges", []):
                    for time_range in entity_data["time_ranges"]:
                        consolidated_timeline.append({
                            "entity": entity_name,
                            "start": time_range["start"],
                            "end": time_range["end"],
                            "start_second": time_range["start_second"],
                            "end_second": time_range["end_second"],
                            "duration_seconds": time_range["duration_seconds"]
                        })
        
        # Sort timeline by start time
        consolidated_timeline.sort(key=lambda x: x["start_second"])

        return VideoReport(
            video_id=video_id,
            filename=video.filename,
            duration_seconds=video.duration_seconds or 0.0,
            total_frames_analyzed=video.total_frames_analyzed or 0,
            interval_seconds=video.interval_seconds,
            unique_entities=unique_entities,
            entity_appearances=entity_appearances,
            timeline=timeline,
            statistics=statistics,
            consolidated_timeline=consolidated_timeline
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read report: {str(e)}")


@router.delete("/{video_id}", response_model=DeleteVideoResponse)
def delete_video(
    video_id: str,
    delete_files: bool = True,
    db: Session = Depends(get_db)
):
    """
    Delete a video and optionally its associated files.

    - **delete_files**: Whether to delete physical files (default: true)
    """
    success = video_service.delete_video(db, video_id, delete_files)

    if not success:
        raise HTTPException(status_code=404, detail="Video not found")

    return DeleteVideoResponse(
        success=True,
        message="Video deleted successfully" if delete_files else "Video record deleted (files preserved)",
        video_id=video_id
    )


@router.get("/{video_id}/download/video")
def download_video(video_id: str, db: Session = Depends(get_db)):
    """
    Download the original video file.
    """
    video = video_service.get_video(db, video_id)

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if not video.video_path or not Path(video.video_path).exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(
        path=video.video_path,
        filename=video.original_filename,
        media_type="video/mp4"
    )


@router.get("/{video_id}/download/report")
def download_report(video_id: str, db: Session = Depends(get_db)):
    """
    Download the detection report as a JSON file.
    """
    video = video_service.get_video(db, video_id)

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if video.status != "completed":
        raise HTTPException(status_code=400, detail="Video has not been processed yet")

    if not video.report_path or not Path(video.report_path).exists():
        raise HTTPException(status_code=404, detail="Report file not found")

    return FileResponse(
        path=video.report_path,
        filename=f"{video.filename}_report.json",
        media_type="application/json"
    )


@router.get("/{video_id}/frames", response_model=list[FrameInfo])
def list_frames(video_id: str, db: Session = Depends(get_db)):
    """
    List all extracted frames for a video.
    """
    video = video_service.get_video(db, video_id)

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if not video.frames_directory:
        raise HTTPException(status_code=404, detail="No frames available for this video")

    frame_paths = storage_service.list_frames(video_id)

    frames = []
    for frame_path in frame_paths:
        # Extract frame number from filename (e.g., "frame_00005.jpg" -> 5)
        frame_filename = Path(frame_path).name
        try:
            frame_number = int(frame_filename.split('_')[1].split('.')[0])
            timestamp = frame_number * video.interval_seconds

            frames.append(FrameInfo(
                frame_number=frame_number,
                timestamp=float(timestamp),
                frame_path=frame_path,
                entities_detected=[]  # Could be populated from report if needed
            ))
        except (IndexError, ValueError):
            continue

    return frames


@router.get("/{video_id}/frames/{frame_number}")
def get_frame(video_id: str, frame_number: int, db: Session = Depends(get_db)):
    """
    Get a specific frame image.
    """
    video = video_service.get_video(db, video_id)

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    frame_path = storage_service.get_frame_path(video_id, frame_number)

    if not frame_path:
        raise HTTPException(status_code=404, detail="Frame not found")

    return FileResponse(
        path=frame_path,
        media_type="image/jpeg"
    )
