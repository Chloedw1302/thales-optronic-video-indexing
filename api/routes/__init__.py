"""
API routes.
"""
from api.routes.videos import router as videos_router
from api.routes.health import router as health_router

__all__ = ["videos_router", "health_router"]
