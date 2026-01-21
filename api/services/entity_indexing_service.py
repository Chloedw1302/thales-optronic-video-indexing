"""
Entity indexing service for populating entity search tables from JSON reports.
"""
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import delete

from api.models.video import Video
from api.models.entity import Entity, VideoEntityDetection
from api.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class EntityIndexingService:
    """Service for indexing entity detections from video processing reports."""

    @staticmethod
    def index_video_entities(video_id: str, report_path: str, db: Session) -> Dict[str, Any]:
        """
        Index entities from a video processing report.

        Args:
            video_id: Video UUID
            report_path: Path to report.json file
            db: Database session

        Returns:
            Dictionary with indexing statistics
        """
        try:
            # Load report
            report_file = Path(report_path)
            if not report_file.exists():
                logger.warning(f"Report file not found: {report_path}")
                return {"success": False, "error": "Report file not found", "entities_indexed": 0}

            with open(report_file, 'r') as f:
                report = json.load(f)

            entities_data = report.get("entities", {})
            if not entities_data:
                logger.info(f"No entities found in report for video {video_id}")
                return {"success": True, "entities_indexed": 0}

            # Delete existing detections for this video (for re-indexing)
            db.execute(delete(VideoEntityDetection).where(VideoEntityDetection.video_id == video_id))

            indexed_count = 0
            entities_without_embeddings = []  # Track entities that need embeddings

            # Process each entity
            for entity_name, entity_data in entities_data.items():
                try:
                    # Extract statistics
                    stats = entity_data.get("statistics", {})
                    frames_with_entity = stats.get("frames_with_entity", 0)
                    total_frames_analyzed = stats.get("total_frames_analyzed", 0)
                    presence_percentage = stats.get("presence_percentage", 0.0)

                    # Skip entities with zero presence (optional optimization)
                    if frames_with_entity == 0:
                        continue

                    # Get or create Entity
                    entity = db.query(Entity).filter(Entity.name == entity_name).first()
                    if not entity:
                        entity = Entity(name=entity_name)
                        db.add(entity)
                        db.flush()  # Get entity ID

                    # Track entities without embeddings for batch generation
                    if not entity.embedding:
                        entities_without_embeddings.append(entity)

                    # Extract time ranges
                    time_ranges = entity_data.get("time_ranges", [])
                    time_ranges_json = json.dumps(time_ranges) if time_ranges else None

                    # Calculate first and last appearance
                    first_appearance = None
                    last_appearance = None
                    if time_ranges:
                        first_appearance = time_ranges[0].get("start_second")
                        last_appearance = time_ranges[-1].get("end_second")

                    # Create VideoEntityDetection
                    detection = VideoEntityDetection(
                        video_id=video_id,
                        entity_id=entity.id,
                        frames_with_entity=frames_with_entity,
                        total_frames_analyzed=total_frames_analyzed,
                        presence_percentage=presence_percentage,
                        time_ranges=time_ranges_json,
                        first_appearance_second=first_appearance,
                        last_appearance_second=last_appearance,
                    )
                    db.add(detection)
                    indexed_count += 1

                except Exception as e:
                    logger.error(f"Error indexing entity '{entity_name}' for video {video_id}: {str(e)}")
                    continue

            # Generate embeddings for entities that don't have them
            if entities_without_embeddings:
                try:
                    logger.info(f"Generating embeddings for {len(entities_without_embeddings)} entities")

                    # Extract entity names for batch processing
                    entity_names = [entity.name for entity in entities_without_embeddings]

                    # Generate embeddings in batches (50 at a time)
                    embeddings = EmbeddingService.generate_embeddings_batch(entity_names, batch_size=50)

                    # Update entities with their embeddings
                    for entity, embedding in zip(entities_without_embeddings, embeddings):
                        entity.embedding = json.dumps(embedding)
                        entity.embedding_model = "mistral-embed"
                        entity.embedding_generated_at = datetime.utcnow()

                    logger.info(f"Successfully generated embeddings for {len(entities_without_embeddings)} entities")

                except Exception as e:
                    # Log warning but don't fail the indexing - embeddings are optional
                    logger.warning(f"Failed to generate embeddings for entities: {e}")
                    logger.warning("Continuing without embeddings - semantic search will not work for these entities")

            # Commit all changes
            db.commit()

            logger.info(f"Indexed {indexed_count} entities for video {video_id}")
            return {"success": True, "entities_indexed": indexed_count}

        except Exception as e:
            db.rollback()
            logger.error(f"Error indexing entities for video {video_id}: {str(e)}")
            return {"success": False, "error": str(e), "entities_indexed": 0}

    @staticmethod
    def reindex_video(video_id: str, db: Session) -> Dict[str, Any]:
        """
        Re-index a single video's entities.

        Args:
            video_id: Video UUID
            db: Database session

        Returns:
            Dictionary with indexing statistics
        """
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            return {"success": False, "error": "Video not found"}

        if not video.report_path:
            return {"success": False, "error": "No report path for video"}

        return EntityIndexingService.index_video_entities(video_id, video.report_path, db)

    @staticmethod
    def reindex_all_videos(db: Session) -> Dict[str, Any]:
        """
        Re-index all completed videos.

        Args:
            db: Database session

        Returns:
            Dictionary with overall statistics
        """
        videos = db.query(Video).filter(
            Video.status == "completed",
            Video.report_path.isnot(None)
        ).all()

        total_videos = len(videos)
        indexed_count = 0
        failed_count = 0
        skipped_count = 0
        total_entities = 0

        logger.info(f"Starting reindex of {total_videos} videos")

        for video in videos:
            try:
                result = EntityIndexingService.index_video_entities(
                    str(video.id),
                    video.report_path,
                    db
                )

                if result["success"]:
                    indexed_count += 1
                    total_entities += result["entities_indexed"]
                else:
                    if "not found" in result.get("error", "").lower():
                        skipped_count += 1
                    else:
                        failed_count += 1

            except Exception as e:
                logger.error(f"Error reindexing video {video.id}: {str(e)}")
                failed_count += 1

        logger.info(
            f"Reindex complete: {indexed_count} videos indexed, "
            f"{failed_count} failed, {skipped_count} skipped, "
            f"{total_entities} total entities"
        )

        return {
            "success": True,
            "total_videos": total_videos,
            "indexed_count": indexed_count,
            "failed_count": failed_count,
            "skipped_count": skipped_count,
            "total_entities_indexed": total_entities,
        }
