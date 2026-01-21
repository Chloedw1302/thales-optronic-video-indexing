"""
FastAPI application entry point for Thales Video Indexing API.
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging
import asyncio
import json
from datetime import datetime
from threading import Thread

from api.config import settings
from api.database import init_db, SessionLocal
from api.routes import videos_router, health_router
from api.routes.search import router as search_router
from api.models.entity import Entity
from api.services.embedding_service import EmbeddingService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Thales Video Indexing API",
    description="""
    REST API for uploading and processing military entity detection videos.

    ## Features

    * **Upload Videos**: Upload video files with optional voice transcripts
    * **Background Processing**: Videos are processed asynchronously using entity detection
    * **Track Progress**: Monitor processing status and progress in real-time
    * **View Reports**: Access detailed detection reports with entity timelines
    * **Download Results**: Download processed frames and reports
    * **Manage Videos**: List, filter, and delete videos

    ## Processing Pipeline

    1. **Upload**: Video and optional voice file are uploaded
    2. **Entity Extraction**: Entities are extracted from voice transcript (if provided)
    3. **Frame Extraction**: Frames are extracted at specified intervals
    4. **Visual Detection**: Pixtral vision model detects entities in each frame
    5. **Report Generation**: Comprehensive report with timelines and statistics

    ## Authentication

    Authentication is not currently implemented. This can be added later using JWT tokens.
    """,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed messages."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "detail": exc.errors(),
            "body": exc.body
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred"
        }
    )


def generate_missing_embeddings():
    """
    Background task to generate embeddings for entities that don't have them.

    This runs on startup to ensure all existing entities have embeddings
    for semantic search functionality.
    """
    db = SessionLocal()
    try:
        # Find entities without embeddings
        entities = db.query(Entity).filter(Entity.embedding.is_(None)).all()

        if not entities:
            logger.info("All entities already have embeddings")
            return

        logger.info(f"Found {len(entities)} entities without embeddings")
        logger.info("Starting background embedding generation...")

        # Process in batches of 50
        batch_size = 50
        successful = 0
        failed = 0

        for i in range(0, len(entities), batch_size):
            batch = entities[i:i + batch_size]
            entity_names = [e.name for e in batch]

            try:
                logger.info(f"Processing batch {i // batch_size + 1}/{(len(entities) + batch_size - 1) // batch_size}")
                embeddings = EmbeddingService.generate_embeddings_batch(entity_names, batch_size=batch_size)

                # Update entities with their embeddings
                for entity, embedding in zip(batch, embeddings):
                    entity.embedding = json.dumps(embedding)
                    entity.embedding_model = "mistral-embed"
                    entity.embedding_generated_at = datetime.utcnow()

                db.commit()
                successful += len(batch)
                logger.info(f"Successfully generated embeddings for batch ({successful}/{len(entities)})")

            except Exception as e:
                logger.error(f"Failed to generate embeddings for batch: {e}")
                db.rollback()
                failed += len(batch)

        logger.info(f"Embedding generation complete: {successful} successful, {failed} failed")

    except Exception as e:
        logger.error(f"Error in background embedding generation: {e}")
        db.rollback()
    finally:
        db.close()


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database and resources on startup."""
    logger.info("Starting Thales Video Indexing API...")
    logger.info(f"Version: {settings.app_version}")
    logger.info(f"Storage directory: {settings.storage_dir}")

    # Initialize database tables
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise

    # Ensure storage directories exist
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    settings.processed_dir.mkdir(parents=True, exist_ok=True)
    logger.info("Storage directories verified")

    # Start background task to generate missing embeddings
    # Run in a separate thread to avoid blocking startup
    embedding_thread = Thread(target=generate_missing_embeddings, daemon=True)
    embedding_thread.start()
    logger.info("Background embedding generation started")

    logger.info("API startup complete")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    logger.info("Shutting down Thales Video Indexing API...")


# Register routers
app.include_router(health_router)
app.include_router(videos_router)
app.include_router(search_router)


# Root endpoint
@app.get("/", tags=["root"])
def root():
    """
    Root endpoint with API information.
    """
    return {
        "message": "Thales Video Indexing API",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/api/health",
        "videos": "/api/v1/videos"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
