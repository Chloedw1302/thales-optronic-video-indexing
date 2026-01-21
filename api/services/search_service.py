"""
Search service for entity-based video search.
"""
import json
import math
import logging
from typing import List, Optional, Tuple
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session, joinedload

from api.models.video import Video
from api.models.entity import Entity, VideoEntityDetection
from api.schemas.search import (
    EntitySearchResult,
    EntityMatchInfo,
    EntityAutocompleteItem,
    EntityStatistics
)
from api.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class SearchService:
    """Service for searching videos by entities."""

    @staticmethod
    def search_videos_by_entities(
        db: Session,
        entity_names: List[str],
        operator: str = "OR",
        min_presence: Optional[float] = None,
        min_frames: Optional[int] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        order: str = "desc",
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[EntitySearchResult], int]:
        """
        Search for videos containing specified entities.

        Args:
            db: Database session
            entity_names: List of entity names to search for
            operator: "AND" or "OR" - how to combine entity filters
            min_presence: Minimum presence percentage (0-100)
            min_frames: Minimum number of frames with entity
            status: Filter by video status
            sort_by: Field to sort by (created_at, presence_percentage, frames_with_entity)
            order: Sort order (asc, desc)
            page: Page number (1-indexed)
            limit: Results per page

        Returns:
            Tuple of (search results, total count)
        """
        # Base query
        query = db.query(Video).distinct()

        # Join with entity detections
        query = query.join(
            VideoEntityDetection,
            Video.id == VideoEntityDetection.video_id
        ).join(
            Entity,
            VideoEntityDetection.entity_id == Entity.id
        )

        # Filter by entity names
        if entity_names:
            entity_filters = [Entity.name == name for name in entity_names]

            if operator.upper() == "AND":
                # For AND: video must have ALL entities
                # Use subquery to count distinct matched entities
                for entity_name in entity_names:
                    subquery = db.query(VideoEntityDetection.video_id).join(
                        Entity
                    ).filter(Entity.name == entity_name)

                    if min_presence is not None:
                        subquery = subquery.filter(VideoEntityDetection.presence_percentage >= min_presence)
                    if min_frames is not None:
                        subquery = subquery.filter(VideoEntityDetection.frames_with_entity >= min_frames)

                    query = query.filter(Video.id.in_(subquery))
            else:
                # For OR: video must have ANY entity
                query = query.filter(or_(*entity_filters))

                if min_presence is not None:
                    query = query.filter(VideoEntityDetection.presence_percentage >= min_presence)
                if min_frames is not None:
                    query = query.filter(VideoEntityDetection.frames_with_entity >= min_frames)

        # Filter by video status
        if status:
            query = query.filter(Video.status == status)

        # Get total count before pagination
        total = query.count()

        # Sorting
        if sort_by == "presence_percentage":
            sort_field = VideoEntityDetection.presence_percentage
        elif sort_by == "frames_with_entity":
            sort_field = VideoEntityDetection.frames_with_entity
        else:
            sort_field = getattr(Video, sort_by, Video.created_at)

        if order.lower() == "asc":
            query = query.order_by(sort_field.asc())
        else:
            query = query.order_by(sort_field.desc())

        # Pagination
        offset = (page - 1) * limit
        videos = query.offset(offset).limit(limit).all()

        # Build results with matched entity details
        results = []
        for video in videos:
            # Get all matched entities for this video
            matched_entities_query = db.query(VideoEntityDetection).join(
                Entity
            ).filter(
                VideoEntityDetection.video_id == video.id
            )

            if entity_names:
                matched_entities_query = matched_entities_query.filter(
                    Entity.name.in_(entity_names)
                )

            if min_presence is not None:
                matched_entities_query = matched_entities_query.filter(
                    VideoEntityDetection.presence_percentage >= min_presence
                )

            if min_frames is not None:
                matched_entities_query = matched_entities_query.filter(
                    VideoEntityDetection.frames_with_entity >= min_frames
                )

            matched_detections = matched_entities_query.options(
                joinedload(VideoEntityDetection.entity)
            ).all()

            # Convert to EntityMatchInfo
            matched_entities = [
                EntityMatchInfo(
                    entity_id=str(det.entity_id),
                    entity_name=det.entity.name,
                    frames_with_entity=det.frames_with_entity,
                    total_frames_analyzed=det.total_frames_analyzed,
                    presence_percentage=det.presence_percentage,
                    first_appearance_second=det.first_appearance_second,
                    last_appearance_second=det.last_appearance_second
                )
                for det in matched_detections
            ]

            results.append(
                EntitySearchResult(
                    id=str(video.id),
                    filename=video.filename,
                    status=video.status,
                    duration_seconds=video.duration_seconds,
                    total_frames_analyzed=video.total_frames_analyzed,
                    unique_entities_count=video.unique_entities_count,
                    created_at=video.created_at,
                    processed_at=video.processed_at,
                    matched_entities=matched_entities
                )
            )

        return results, total

    @staticmethod
    def search_videos_by_similarity(
        db: Session,
        query: str,
        similarity_threshold: float = 0.7,
        top_k: int = 10,
        min_presence: Optional[float] = None,
        min_frames: Optional[int] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        order: str = "desc",
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[EntitySearchResult], int, List[Tuple[str, float]]]:
        """
        Search for videos using semantic similarity.

        First finds entities semantically similar to the query, then searches
        for videos containing those entities.

        Args:
            db: Database session
            query: Natural language search query (e.g., "tanks", "soldiers")
            similarity_threshold: Minimum cosine similarity (0-1, default 0.7)
            top_k: Maximum number of similar entities to find
            min_presence: Minimum presence percentage (0-100)
            min_frames: Minimum number of frames with entity
            status: Filter by video status
            sort_by: Field to sort by
            order: Sort order (asc, desc)
            page: Page number (1-indexed)
            limit: Results per page

        Returns:
            Tuple of (search results, total count, matched entities with similarity scores)
        """
        try:
            # Generate embedding for search query
            logger.info(f"Generating embedding for query: '{query}'")
            query_embedding = EmbeddingService.generate_embedding(query)

            # Load all entities that have embeddings
            entities = db.query(Entity).filter(Entity.embedding.isnot(None)).all()

            if not entities:
                logger.warning("No entities with embeddings found")
                return [], 0, []

            logger.info(f"Comparing query against {len(entities)} entities")

            # Compute similarities
            entity_similarities = []
            for entity in entities:
                try:
                    # Parse embedding from JSON
                    entity_embedding = json.loads(entity.embedding)

                    # Compute cosine similarity
                    similarity = EmbeddingService.compute_cosine_similarity(
                        query_embedding,
                        entity_embedding
                    )

                    if similarity >= similarity_threshold:
                        entity_similarities.append((entity.name, similarity))

                except Exception as e:
                    logger.warning(f"Error processing entity '{entity.name}': {e}")
                    continue

            # Sort by similarity (highest first) and take top K
            entity_similarities.sort(key=lambda x: x[1], reverse=True)
            top_entities = entity_similarities[:top_k]

            if not top_entities:
                logger.info(f"No entities found with similarity >= {similarity_threshold}")
                return [], 0, []

            # Extract entity names
            entity_names = [name for name, _ in top_entities]
            logger.info(f"Found {len(entity_names)} similar entities: {entity_names}")

            # Use existing search function with OR operator
            results, total = SearchService.search_videos_by_entities(
                db=db,
                entity_names=entity_names,
                operator="OR",
                min_presence=min_presence,
                min_frames=min_frames,
                status=status,
                sort_by=sort_by,
                order=order,
                page=page,
                limit=limit
            )

            return results, total, top_entities

        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            raise

    @staticmethod
    def autocomplete_entities(
        db: Session,
        query: str,
        limit: int = 10,
        use_semantic: bool = False,
        similarity_threshold: float = 0.6
    ) -> List[EntityAutocompleteItem]:
        """
        Get entity name suggestions for autocomplete.

        Args:
            db: Database session
            query: Prefix to search for (or semantic query if use_semantic=True)
            limit: Maximum number of suggestions
            use_semantic: If True, use semantic similarity instead of prefix matching
            similarity_threshold: Minimum similarity for semantic search (default 0.6)

        Returns:
            List of entity suggestions with video counts
        """
        if use_semantic:
            try:
                # Generate embedding for query
                query_embedding = EmbeddingService.generate_embedding(query)

                # Load all entities with embeddings and their video counts
                entities = db.query(
                    Entity.id,
                    Entity.name,
                    Entity.embedding,
                    func.count(VideoEntityDetection.video_id).label('video_count')
                ).outerjoin(
                    VideoEntityDetection,
                    Entity.id == VideoEntityDetection.entity_id
                ).filter(
                    Entity.embedding.isnot(None)
                ).group_by(
                    Entity.id,
                    Entity.name,
                    Entity.embedding
                ).all()

                # Compute similarities and filter
                entity_scores = []
                for entity in entities:
                    try:
                        entity_embedding = json.loads(entity.embedding)
                        similarity = EmbeddingService.compute_cosine_similarity(
                            query_embedding,
                            entity_embedding
                        )

                        if similarity >= similarity_threshold:
                            entity_scores.append((entity, similarity))

                    except Exception as e:
                        logger.warning(f"Error processing entity '{entity.name}': {e}")
                        continue

                # Sort by similarity (highest first), then by video count
                entity_scores.sort(key=lambda x: (x[1], x[0].video_count), reverse=True)

                # Take top results
                top_entities = entity_scores[:limit]

                return [
                    EntityAutocompleteItem(
                        id=str(entity.id),
                        name=entity.name,
                        video_count=entity.video_count
                    )
                    for entity, _ in top_entities
                ]

            except Exception as e:
                logger.error(f"Semantic autocomplete failed, falling back to prefix matching: {e}")
                # Fall through to prefix matching on error

        # Default prefix matching behavior
        entities = db.query(
            Entity.id,
            Entity.name,
            func.count(VideoEntityDetection.video_id).label('video_count')
        ).outerjoin(
            VideoEntityDetection,
            Entity.id == VideoEntityDetection.entity_id
        ).filter(
            Entity.name.ilike(f"{query}%")
        ).group_by(
            Entity.id,
            Entity.name
        ).order_by(
            func.count(VideoEntityDetection.video_id).desc(),
            Entity.name
        ).limit(limit).all()

        return [
            EntityAutocompleteItem(
                id=str(entity.id),
                name=entity.name,
                video_count=entity.video_count
            )
            for entity in entities
        ]

    @staticmethod
    def get_entity_statistics(db: Session) -> List[EntityStatistics]:
        """
        Get statistics for all entities.

        Args:
            db: Database session

        Returns:
            List of entity statistics
        """
        stats = db.query(
            Entity.id,
            Entity.name,
            Entity.category,
            Entity.created_at,
            func.count(func.distinct(VideoEntityDetection.video_id)).label('video_count'),
            func.count(VideoEntityDetection.id).label('total_appearances'),
            func.avg(VideoEntityDetection.presence_percentage).label('avg_presence')
        ).outerjoin(
            VideoEntityDetection,
            Entity.id == VideoEntityDetection.entity_id
        ).group_by(
            Entity.id,
            Entity.name,
            Entity.category,
            Entity.created_at
        ).order_by(
            func.count(func.distinct(VideoEntityDetection.video_id)).desc()
        ).all()

        return [
            EntityStatistics(
                id=str(stat.id),
                name=stat.name,
                category=stat.category,
                video_count=stat.video_count,
                total_appearances=stat.total_appearances,
                avg_presence_percentage=round(stat.avg_presence or 0.0, 2),
                created_at=stat.created_at
            )
            for stat in stats
        ]

    @staticmethod
    def search_videos_unified(
        db: Session,
        query: str,
        similarity_threshold: float = 0.7,
        top_k: int = 10,
        min_presence: Optional[float] = None,
        min_frames: Optional[int] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        order: str = "desc",
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[EntitySearchResult], int, int, List[Tuple[str, float]]]:
        """
        Unified search that combines exact and semantic search.

        First performs exact search for entity names that match the query exactly,
        then enhances with semantic search to find similar entities.

        Args:
            db: Database session
            query: Search query (can be entity names or natural language)
            similarity_threshold: Minimum cosine similarity (0-1, default 0.7)
            top_k: Maximum number of similar entities to find
            min_presence: Minimum presence percentage (0-100)
            min_frames: Minimum number of frames with entity
            status: Filter by video status
            sort_by: Field to sort by
            order: Sort order (asc, desc)
            page: Page number (1-indexed)
            limit: Results per page

        Returns:
            Tuple of (merged search results, exact match count, semantic match count, matched entities with similarity scores)
        """
        try:
            # Step 1: Perform exact search for entity names that match the query
            # Parse query into potential entity names (comma-separated)
            entity_names = [e.strip() for e in query.split(",") if e.strip()]
            
            exact_results = []
            exact_count = 0
            
            if entity_names:
                # Try exact search first
                try:
                    exact_results, exact_count = SearchService.search_videos_by_entities(
                        db=db,
                        entity_names=entity_names,
                        operator="OR",
                        min_presence=min_presence,
                        min_frames=min_frames,
                        status=status,
                        sort_by=sort_by,
                        order=order,
                        page=1,  # Get all exact results for merging
                        limit=1000  # Large limit to get most exact results
                    )
                    logger.info(f"Exact search found {exact_count} results for entities: {entity_names}")
                except Exception as e:
                    logger.warning(f"Exact search failed, continuing with semantic only: {e}")
                    exact_results = []
                    exact_count = 0

            # Step 2: Perform semantic search to find similar entities
            semantic_results = []
            semantic_count = 0
            matched_entities = []
            
            try:
                # Use the original query for semantic search
                semantic_results, semantic_count, matched_entities = SearchService.search_videos_by_similarity(
                    db=db,
                    query=query,
                    similarity_threshold=similarity_threshold,
                    top_k=top_k,
                    min_presence=min_presence,
                    min_frames=min_frames,
                    status=status,
                    sort_by=sort_by,
                    order=order,
                    page=1,  # Get all semantic results for merging
                    limit=1000  # Large limit to get most semantic results
                )
                logger.info(f"Semantic search found {semantic_count} results for query: '{query}'")
            except Exception as e:
                logger.warning(f"Semantic search failed, continuing with exact only: {e}")
                semantic_results = []
                semantic_count = 0
                matched_entities = []

            # Step 3: Merge results, prioritizing exact matches and removing duplicates
            # Create a set of video IDs to track duplicates
            seen_video_ids = set()
            merged_results = []
            
            # Add exact matches first (they get priority)
            for result in exact_results:
                if result.id not in seen_video_ids:
                    seen_video_ids.add(result.id)
                    merged_results.append(result)
            
            # Add semantic matches that aren't already included
            for result in semantic_results:
                if result.id not in seen_video_ids:
                    seen_video_ids.add(result.id)
                    merged_results.append(result)
            
            # Step 4: Apply pagination to merged results
            total_merged = len(merged_results)
            total_pages = max(1, math.ceil(total_merged / limit))
            
            # Sort merged results by the specified criteria
            if sort_by == "presence_percentage":
                merged_results.sort(key=lambda x: max(
                    (det.presence_percentage for det in x.matched_entities), 
                    default=0
                ), reverse=(order.lower() == "desc"))
            elif sort_by == "frames_with_entity":
                merged_results.sort(key=lambda x: max(
                    (det.frames_with_entity for det in x.matched_entities), 
                    default=0
                ), reverse=(order.lower() == "desc"))
            else:
                # Default sorting by created_at
                merged_results.sort(key=lambda x: x.created_at, reverse=(order.lower() == "desc"))
            
            # Apply pagination
            offset = (page - 1) * limit
            paginated_results = merged_results[offset:offset + limit]
            
            logger.info(f"Unified search: {exact_count} exact + {semantic_count} semantic = {total_merged} total (after deduplication)")
            
            return paginated_results, exact_count, semantic_count, matched_entities

        except Exception as e:
            logger.error(f"Unified search failed: {e}")
            raise
