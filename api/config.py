"""
Configuration settings for the Thales Video Indexing API.
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Application
    app_name: str = "Thales Video Indexing API"
    app_version: str = "1.0.0"
    debug: bool = False

    # API Keys
    mistral_api_key: str

    # Database
    database_url: str = "sqlite:///./thales.db"

    # Storage paths
    base_dir: Path = Path(__file__).parent.parent
    storage_dir: Path = base_dir / "storage"
    uploads_dir: Path = storage_dir / "uploads"
    processed_dir: Path = storage_dir / "processed"

    # File upload limits
    max_video_size_mb: int = 2000  # 2GB
    max_voice_file_size_mb: int = 10  # 10MB

    # Allowed file extensions
    allowed_video_extensions: set = {".mkv", ".mp4", ".avi", ".mov"}
    allowed_voice_extensions: set = {".txt"}

    # Video processing defaults
    default_interval_seconds: int = 5
    min_interval_seconds: int = 1
    max_interval_seconds: int = 60

    # CORS settings
    cors_origins: list = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Create singleton settings instance
settings = Settings()

# Ensure storage directories exist
settings.uploads_dir.mkdir(parents=True, exist_ok=True)
settings.processed_dir.mkdir(parents=True, exist_ok=True)
