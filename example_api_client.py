"""
Example Python client for the Thales Video Indexing API.

This script demonstrates how to:
1. Upload a video with optional voice file
2. Monitor processing progress
3. Retrieve and display results
"""

import requests
import time
import sys
from pathlib import Path


class VideoIndexingClient:
    """Client for interacting with the Thales Video Indexing API."""

    def __init__(self, base_url: str = "http://localhost:8000"):
        """
        Initialize the client.

        Args:
            base_url: Base URL of the API (default: http://localhost:8000)
        """
        self.base_url = base_url.rstrip("/")
        self.videos_url = f"{self.base_url}/api/v1/videos"

    def check_health(self) -> dict:
        """Check API health status."""
        response = requests.get(f"{self.base_url}/api/health")
        response.raise_for_status()
        return response.json()

    def upload_video(
        self,
        video_path: str,
        voice_path: str = None,
        interval_seconds: int = 5,
        process_immediately: bool = True
    ) -> dict:
        """
        Upload a video file.

        Args:
            video_path: Path to video file
            voice_path: Optional path to voice transcript
            interval_seconds: Frame extraction interval
            process_immediately: Start processing immediately

        Returns:
            Upload response with video_id
        """
        files = {}
        data = {
            "interval_seconds": interval_seconds,
            "process_immediately": process_immediately
        }

        # Open video file
        video_file = open(video_path, "rb")
        files["video_file"] = (Path(video_path).name, video_file)

        # Open voice file if provided
        voice_file = None
        if voice_path:
            voice_file = open(voice_path, "rb")
            files["voice_file"] = (Path(voice_path).name, voice_file)

        try:
            response = requests.post(
                f"{self.videos_url}/upload",
                files=files,
                data=data
            )
            response.raise_for_status()
            return response.json()

        finally:
            video_file.close()
            if voice_file:
                voice_file.close()

    def get_status(self, video_id: str) -> dict:
        """
        Get processing status for a video.

        Args:
            video_id: Video ID

        Returns:
            Status information
        """
        response = requests.get(f"{self.videos_url}/{video_id}/status")
        response.raise_for_status()
        return response.json()

    def get_video(self, video_id: str) -> dict:
        """
        Get detailed video information.

        Args:
            video_id: Video ID

        Returns:
            Video details
        """
        response = requests.get(f"{self.videos_url}/{video_id}")
        response.raise_for_status()
        return response.json()

    def get_report(self, video_id: str) -> dict:
        """
        Get detection report for a video.

        Args:
            video_id: Video ID

        Returns:
            Detection report
        """
        response = requests.get(f"{self.videos_url}/{video_id}/report")
        response.raise_for_status()
        return response.json()

    def list_videos(self, status: str = None, page: int = 1, limit: int = 20) -> dict:
        """
        List videos with optional filtering.

        Args:
            status: Filter by status
            page: Page number
            limit: Items per page

        Returns:
            List of videos
        """
        params = {"page": page, "limit": limit}
        if status:
            params["status"] = status

        response = requests.get(self.videos_url, params=params)
        response.raise_for_status()
        return response.json()

    def delete_video(self, video_id: str, delete_files: bool = True) -> dict:
        """
        Delete a video.

        Args:
            video_id: Video ID
            delete_files: Whether to delete files

        Returns:
            Deletion response
        """
        params = {"delete_files": delete_files}
        response = requests.delete(f"{self.videos_url}/{video_id}", params=params)
        response.raise_for_status()
        return response.json()

    def wait_for_completion(
        self,
        video_id: str,
        poll_interval: int = 5,
        timeout: int = 3600
    ) -> dict:
        """
        Wait for video processing to complete.

        Args:
            video_id: Video ID
            poll_interval: Seconds between status checks
            timeout: Maximum time to wait

        Returns:
            Final status

        Raises:
            TimeoutError: If processing doesn't complete within timeout
        """
        start_time = time.time()

        while True:
            status = self.get_status(video_id)

            print(f"Status: {status['status']} - "
                  f"{status.get('progress_percentage', 0):.1f}% - "
                  f"{status.get('current_stage', 'Unknown')}")

            if status["status"] == "completed":
                print("\nProcessing completed successfully!")
                return status

            if status["status"] == "failed":
                error_msg = status.get("error_message", "Unknown error")
                print(f"\nProcessing failed: {error_msg}")
                return status

            # Check timeout
            if time.time() - start_time > timeout:
                raise TimeoutError(f"Processing did not complete within {timeout} seconds")

            time.sleep(poll_interval)


def main():
    """Example usage of the API client."""
    # Initialize client
    client = VideoIndexingClient()

    # Check API health
    print("Checking API health...")
    try:
        health = client.check_health()
        print(f"API Status: {health['status']}")
        print(f"Videos in database: {health['checks']['database']['video_count']}")
    except Exception as e:
        print(f"Error: Could not connect to API. Is it running? ({str(e)})")
        sys.exit(1)

    # Example: Upload a video
    video_path = "data/video_1.mkv"
    voice_path = "data/voice_1.txt"

    # Check if files exist
    if not Path(video_path).exists():
        print(f"Error: Video file not found: {video_path}")
        print("Please update the video_path in this script to point to a valid video file")
        sys.exit(1)

    print(f"\nUploading video: {video_path}")
    if Path(voice_path).exists():
        print(f"With voice file: {voice_path}")

    try:
        result = client.upload_video(
            video_path=video_path,
            voice_path=voice_path if Path(voice_path).exists() else None,
            interval_seconds=5,
            process_immediately=True
        )

        video_id = result["video_id"]
        print(f"\nVideo uploaded successfully!")
        print(f"Video ID: {video_id}")
        print(f"Status: {result['status']}")
        print(f"Message: {result['message']}")

        # Wait for processing to complete
        print("\nWaiting for processing to complete...")
        final_status = client.wait_for_completion(video_id, poll_interval=5)

        if final_status["status"] == "completed":
            # Get detailed results
            print("\nFetching results...")
            report = client.get_report(video_id)

            print(f"\n{'='*60}")
            print("DETECTION REPORT")
            print(f"{'='*60}")
            print(f"Video: {report['filename']}")
            print(f"Duration: {report['duration_seconds']:.2f} seconds")
            print(f"Frames analyzed: {report['total_frames_analyzed']}")
            print(f"Interval: {report['interval_seconds']} seconds")
            print(f"\nUnique entities detected: {len(report['unique_entities'])}")

            if report['unique_entities']:
                print("\nEntities found:")
                for entity in report['unique_entities']:
                    entity_data = report['entity_appearances'].get(entity, {})
                    appearances = entity_data.get('total_appearances', 0)
                    print(f"  - {entity}: {appearances} appearances")

            print(f"\n{'='*60}")

    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
