# Thales Video Indexing API - Quick Start Guide

## Overview

The FastAPI integration provides a REST API for uploading videos, processing them through the entity detection pipeline, and retrieving results.

## Installation

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Ensure Mistral API key is configured:**
Make sure your `.env` file contains:
```
MISTRAL_API_KEY=your_api_key_here
```

## Running the API

### Development Mode

```bash
# Start the API server with hot reload
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
# Using Uvicorn
uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4

# Or using Gunicorn with Uvicorn workers
gunicorn api.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

The API will be available at: http://localhost:8000

## API Documentation

Once the server is running, access the interactive documentation at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Quick Usage Examples

### 1. Upload a Video (with voice file)

```bash
curl -X POST "http://localhost:8000/api/v1/videos/upload" \
  -F "video_file=@data/video_1.mkv" \
  -F "voice_file=@data/voice_1.txt" \
  -F "interval_seconds=5" \
  -F "process_immediately=true"
```

Response:
```json
{
  "video_id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "video_video_1.mkv",
  "status": "uploaded",
  "has_voice_file": true,
  "interval_seconds": 5,
  "message": "Video uploaded successfully. Processing started."
}
```

### 2. Upload a Video (without voice file)

```bash
curl -X POST "http://localhost:8000/api/v1/videos/upload" \
  -F "video_file=@data/video_1.mkv" \
  -F "interval_seconds=5"
```

When no voice file is provided, the system uses default entity categories for visual detection.

### 3. Check Processing Status

```bash
curl "http://localhost:8000/api/v1/videos/{video_id}/status"
```

Response:
```json
{
  "video_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing",
  "progress_percentage": 45.0,
  "current_stage": "Detecting entities in frames",
  "progress_message": "Analyzing video frames",
  "error_message": null
}
```

### 4. Get Video Details

```bash
curl "http://localhost:8000/api/v1/videos/{video_id}"
```

### 5. List All Videos

```bash
# List all videos
curl "http://localhost:8000/api/v1/videos"

# Filter by status
curl "http://localhost:8000/api/v1/videos?status=completed"

# With pagination
curl "http://localhost:8000/api/v1/videos?page=1&limit=10"
```

### 6. Get Detection Report

```bash
curl "http://localhost:8000/api/v1/videos/{video_id}/report"
```

### 7. Download Video

```bash
curl -O "http://localhost:8000/api/v1/videos/{video_id}/download/video"
```

### 8. Download Report

```bash
curl -O "http://localhost:8000/api/v1/videos/{video_id}/download/report"
```

### 9. List Frames

```bash
curl "http://localhost:8000/api/v1/videos/{video_id}/frames"
```

### 10. Get Specific Frame

```bash
curl -O "http://localhost:8000/api/v1/videos/{video_id}/frames/5"
```

### 11. Delete Video

```bash
# Delete video and all files
curl -X DELETE "http://localhost:8000/api/v1/videos/{video_id}"

# Delete database record only (preserve files)
curl -X DELETE "http://localhost:8000/api/v1/videos/{video_id}?delete_files=false"
```

### 12. Health Check

```bash
curl "http://localhost:8000/api/health"
```

## API Endpoints

### Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/videos/upload` | Upload video with optional voice file |
| GET | `/api/v1/videos` | List all videos with filtering/pagination |
| GET | `/api/v1/videos/{video_id}` | Get detailed video information |
| GET | `/api/v1/videos/{video_id}/status` | Get processing status |
| POST | `/api/v1/videos/{video_id}/process` | Trigger processing for uploaded video |
| GET | `/api/v1/videos/{video_id}/report` | Get detection report |
| DELETE | `/api/v1/videos/{video_id}` | Delete video |
| GET | `/api/v1/videos/{video_id}/download/video` | Download original video |
| GET | `/api/v1/videos/{video_id}/download/report` | Download report JSON |
| GET | `/api/v1/videos/{video_id}/frames` | List all frames |
| GET | `/api/v1/videos/{video_id}/frames/{frame_number}` | Get specific frame image |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check API health and system status |

## Processing Pipeline

When a video is uploaded with `process_immediately=true`:

1. **Upload** (0-5%): Video and voice files are saved to storage
2. **Analyze Video** (5-10%): Video duration and metadata extracted
3. **Extract Entities** (10-20%): Entities extracted from voice file (if provided)
4. **Detect in Frames** (20-75%): Pixtral analyzes frames for entity presence
5. **Save Frames** (75-85%): Frames saved to disk
6. **Generate Report** (85-100%): Comprehensive report with timelines created
7. **Complete**: Status set to "completed", results available

## Storage Structure

```
storage/
├── uploads/              # User-uploaded files
│   └── {video_id}/
│       ├── video.{ext}   # Original video
│       └── voice.txt     # Optional voice file
└── processed/            # Processing outputs
    └── {video_id}/
        ├── frames/       # Extracted frames
        │   ├── frame_00000.jpg
        │   ├── frame_00005.jpg
        │   └── ...
        └── report.json   # Detection report
```

## Database

- **Type**: SQLite (single file: `thales.db`)
- **Location**: Project root directory
- **Migration**: Automatic on startup (tables created if they don't exist)

## Configuration

Edit `api/config.py` to customize:

- File size limits
- Allowed file extensions
- Storage paths
- CORS settings
- Processing intervals

## Video Status Flow

```
uploaded → processing → completed
                     ↓
                   failed
```

- **uploaded**: Video uploaded, not yet processed
- **processing**: Currently being processed
- **completed**: Processing finished successfully
- **failed**: Processing encountered an error

## Error Handling

The API returns standard HTTP status codes:

- `200`: Success
- `201`: Created (upload successful)
- `400`: Bad request (validation error)
- `404`: Not found
- `422`: Unprocessable entity (invalid data)
- `500`: Internal server error

Error responses include detailed messages:
```json
{
  "error": "Error type",
  "detail": "Detailed error message"
}
```

## Background Processing

Videos are processed in the background using FastAPI's `BackgroundTasks`. This means:

- Upload endpoints return immediately
- Processing happens asynchronously
- Poll the `/status` endpoint to track progress
- Tasks run in the same process (simple, no external dependencies)

**Limitations:**
- Tasks lost if server restarts
- Single worker process
- No built-in monitoring UI

For production with multiple workers, consider migrating to Celery + Redis.

## CLI vs API

Both the CLI and API can run simultaneously:

- **CLI**: Uses `data/`, `reports/`, `frames/` directories
- **API**: Uses `storage/uploads/`, `storage/processed/` directories
- No conflicts - completely independent

## Testing

Run the API and test with curl, Postman, or the interactive docs at `/docs`.

Example test workflow:
1. Start API: `uvicorn api.main:app --reload`
2. Upload video: Use curl or Swagger UI
3. Check status: Poll until status is "completed"
4. Get report: Download and view detection results
5. View frames: Access individual frames via API

## Python Client Example

```python
import requests

# Upload video
with open("data/video_1.mkv", "rb") as video, \
     open("data/voice_1.txt", "rb") as voice:

    response = requests.post(
        "http://localhost:8000/api/v1/videos/upload",
        files={
            "video_file": video,
            "voice_file": voice
        },
        data={
            "interval_seconds": 5,
            "process_immediately": True
        }
    )
    video_id = response.json()["video_id"]

# Poll status
import time
while True:
    status = requests.get(f"http://localhost:8000/api/v1/videos/{video_id}/status")
    data = status.json()
    print(f"Status: {data['status']} - {data['progress_percentage']}%")

    if data["status"] in ["completed", "failed"]:
        break

    time.sleep(5)

# Get report
if data["status"] == "completed":
    report = requests.get(f"http://localhost:8000/api/v1/videos/{video_id}/report")
    print(report.json())
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process or use a different port
uvicorn api.main:app --reload --port 8001
```

### Database Locked
SQLite can have concurrency issues. For production, consider PostgreSQL:
```python
# In api/config.py
database_url: str = "postgresql://user:password@localhost/thales"
```

### Processing Fails
Check logs for errors. Common issues:
- Missing Mistral API key
- Invalid video format
- Out of disk space
- Insufficient memory for large videos

### Storage Permission Issues
Ensure the API has write access:
```bash
chmod -R 755 storage/
```

## Next Steps

- Add JWT authentication
- Implement WebSocket for real-time progress
- Add video streaming endpoints
- Create admin dashboard
- Add batch processing
- Implement rate limiting
- Add metrics and monitoring
