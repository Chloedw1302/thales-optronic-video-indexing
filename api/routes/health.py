"""
Health check endpoint.
"""
import os
import shutil
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.database import get_db
from api.config import settings
from api.services import video_service

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """
    Check API health status.

    Returns system health information including:
    - Database connectivity
    - Storage accessibility
    - Disk space
    - Video statistics
    """
    health_status = {
        "status": "healthy",
        "api_version": settings.app_version,
        "checks": {}
    }

    # Check database connection
    try:
        stats = video_service.get_video_statistics(db)
        health_status["checks"]["database"] = {
            "status": "connected",
            "video_count": stats["total_videos"],
            "status_breakdown": stats["status_counts"]
        }
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = {
            "status": "error",
            "error": str(e)
        }

    # Check storage accessibility
    try:
        uploads_accessible = settings.uploads_dir.exists() and os.access(settings.uploads_dir, os.W_OK)
        processed_accessible = settings.processed_dir.exists() and os.access(settings.processed_dir, os.W_OK)

        if uploads_accessible and processed_accessible:
            # Get disk space info
            disk_usage = shutil.disk_usage(settings.storage_dir)
            free_gb = disk_usage.free / (1024 ** 3)
            total_gb = disk_usage.total / (1024 ** 3)
            used_percent = (disk_usage.used / disk_usage.total) * 100

            health_status["checks"]["storage"] = {
                "status": "accessible",
                "uploads_dir": str(settings.uploads_dir),
                "processed_dir": str(settings.processed_dir),
                "disk_space": {
                    "free_gb": round(free_gb, 2),
                    "total_gb": round(total_gb, 2),
                    "used_percent": round(used_percent, 2)
                }
            }
        else:
            health_status["status"] = "unhealthy"
            health_status["checks"]["storage"] = {
                "status": "not_accessible",
                "uploads_accessible": uploads_accessible,
                "processed_accessible": processed_accessible
            }
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["storage"] = {
            "status": "error",
            "error": str(e)
        }

    # Check Mistral API key
    from thales.config import MISTRAL_API_KEY
    health_status["checks"]["mistral_api"] = {
        "status": "configured" if MISTRAL_API_KEY else "not_configured",
        "message": "API key found" if MISTRAL_API_KEY else "MISTRAL_API_KEY not set in .env"
    }

    return health_status
