"""
Search API endpoints for entity-based video search.
"""
import json
import math
import logging
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from api.database import get_db
from api.services.search_service import SearchService
from api.services.entity_indexing_service import EntityIndexingService
from api.services.embedding_service import EmbeddingService
from api.models.entity import Entity
from api.schemas.search import (
    EntitySearchResponse,
    SemanticSearchResponse,
    UnifiedSearchResponse,
    MatchedEntityWithSimilarity,
    EntityAutocompleteItem,
    EntityListResponse,
    ReindexResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/search", tags=["search"])


@router.get("/entities", response_model=EntitySearchResponse)
def search_entities(
    entities: str = Query(..., description="Comma-separated list of entity names"),
    operator: str = Query("OR", description="AND or OR operator for combining entities"),
    min_presence: Optional[float] = Query(None, ge=0, le=100, description="Minimum presence percentage"),
    min_frames: Optional[int] = Query(None, ge=0, description="Minimum number of frames"),
    status: Optional[str] = Query(None, description="Filter by video status"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    order: str = Query("desc", description="Sort order (asc/desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db)
):
    """
    Search for videos containing specified entities.

    Examples:
    - Single entity: ?entities=aircraft
    - Multiple (OR): ?entities=aircraft,helicopter&operator=OR
    - Multiple (AND): ?entities=aircraft,military personnel&operator=AND
    - With filters: ?entities=drone&min_presence=50&min_frames=10
    """
    # Parse entity names
    entity_list = [e.strip() for e in entities.split(",") if e.strip()]

    if not entity_list:
        raise HTTPException(status_code=400, detail="At least one entity name is required")

    # Validate operator
    if operator.upper() not in ["AND", "OR"]:
        raise HTTPException(status_code=400, detail="Operator must be AND or OR")

    # Search
    results, total = SearchService.search_videos_by_entities(
        db=db,
        entity_names=entity_list,
        operator=operator,
        min_presence=min_presence,
        min_frames=min_frames,
        status=status,
        sort_by=sort_by,
        order=order,
        page=page,
        limit=limit
    )

    # Calculate total pages
    total_pages = math.ceil(total / limit) if total > 0 else 0

    return EntitySearchResponse(
        results=results,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        search_params={
            "entities": entity_list,
            "operator": operator,
            "min_presence": min_presence,
            "min_frames": min_frames,
            "status": status,
            "sort_by": sort_by,
            "order": order
        }
    )


@router.get("/entities/semantic", response_model=SemanticSearchResponse)
def search_entities_semantic(
    query: str = Query(..., min_length=1, description="Natural language search query"),
    similarity_threshold: float = Query(0.7, ge=0.0, le=1.0, description="Minimum cosine similarity (0-1)"),
    top_k: int = Query(10, ge=1, le=50, description="Maximum number of similar entities to find"),
    min_presence: Optional[float] = Query(None, ge=0, le=100, description="Minimum presence percentage"),
    min_frames: Optional[int] = Query(None, ge=0, description="Minimum number of frames"),
    status: Optional[str] = Query(None, description="Filter by video status"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    order: str = Query("desc", description="Sort order (asc/desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db)
):
    """
    Search for videos using semantic similarity.

    Finds entities semantically similar to the query, then returns videos
    containing those entities. Useful for natural language queries where
    exact entity names are not known.

    Examples:
    - Semantic query: ?query=tanks → Finds "armored vehicle", "military vehicle"
    - Semantic query: ?query=soldiers → Finds "military personnel", "civilian"
    - With threshold: ?query=aircraft&similarity_threshold=0.8 → Stricter matching
    """
    try:
        # Perform semantic search
        results, total, matched_entities = SearchService.search_videos_by_similarity(
            db=db,
            query=query,
            similarity_threshold=similarity_threshold,
            top_k=top_k,
            min_presence=min_presence,
            min_frames=min_frames,
            status=status,
            sort_by=sort_by,
            order=order,
            page=page,
            limit=limit
        )

        # Calculate total pages
        total_pages = math.ceil(total / limit) if total > 0 else 0

        # Convert matched entities to response format
        matched_entities_response = [
            MatchedEntityWithSimilarity(
                entity_name=entity_name,
                similarity_score=round(similarity, 3)
            )
            for entity_name, similarity in matched_entities
        ]

        return SemanticSearchResponse(
            results=results,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
            matched_entities=matched_entities_response,
            search_params={
                "query": query,
                "similarity_threshold": similarity_threshold,
                "top_k": top_k,
                "min_presence": min_presence,
                "min_frames": min_frames,
                "status": status,
                "sort_by": sort_by,
                "order": order
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Semantic search failed: {str(e)}"
        )


@router.get("/entities/unified", response_model=UnifiedSearchResponse)
def search_entities_unified(
    query: str = Query(..., min_length=1, description="Search query (entity names or natural language)"),
    similarity_threshold: float = Query(0.7, ge=0.0, le=1.0, description="Minimum cosine similarity (0-1)"),
    top_k: int = Query(10, ge=1, le=50, description="Maximum number of similar entities to find"),
    min_presence: Optional[float] = Query(None, ge=0, le=100, description="Minimum presence percentage"),
    min_frames: Optional[int] = Query(None, ge=0, description="Minimum number of frames"),
    status: Optional[str] = Query(None, description="Filter by video status"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    order: str = Query("desc", description="Sort order (asc/desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db)
):
    """
    Unified search that combines exact and semantic search.

    First searches for exact entity matches, then enhances with semantic similarity
    to find additional relevant videos. Results are merged and deduplicated.

    Examples:
    - Simple query: ?query=aircraft → Finds exact "aircraft" matches + similar entities
    - Multiple entities: ?query=aircraft,drone → Finds exact matches + semantic enhancements
    - Natural language: ?query=tanks in the sky → Uses semantic search primarily
    """
    try:
        # Perform unified search
        results, exact_count, semantic_count, matched_entities = SearchService.search_videos_unified(
            db=db,
            query=query,
            similarity_threshold=similarity_threshold,
            top_k=top_k,
            min_presence=min_presence,
            min_frames=min_frames,
            status=status,
            sort_by=sort_by,
            order=order,
            page=page,
            limit=limit
        )

        # Calculate total count (number of unique videos found)
        total_results = len(results) if page == 1 else exact_count + semantic_count
        total_pages = math.ceil(total_results / limit) if total_results > 0 else 0

        # Convert matched entities to response format
        matched_entities_response = [
            MatchedEntityWithSimilarity(
                entity_name=entity_name,
                similarity_score=round(similarity, 3)
            )
            for entity_name, similarity in matched_entities
        ]

        return UnifiedSearchResponse(
            results=results,
            total=total_results,
            page=page,
            limit=limit,
            total_pages=total_pages,
            exact_match_results=exact_count,
            semantic_match_results=semantic_count,
            matched_entities=matched_entities_response,
            search_params={
                "query": query,
                "similarity_threshold": similarity_threshold,
                "top_k": top_k,
                "min_presence": min_presence,
                "min_frames": min_frames,
                "status": status,
                "sort_by": sort_by,
                "order": order
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unified search failed: {str(e)}"
        )


@router.get("/entities/autocomplete", response_model=List[EntityAutocompleteItem])
def autocomplete_entities(
    q: str = Query(..., min_length=1, description="Search query prefix or semantic query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of suggestions"),
    use_semantic: bool = Query(False, description="Use semantic similarity instead of prefix matching"),
    similarity_threshold: float = Query(0.6, ge=0.0, le=1.0, description="Minimum similarity for semantic search"),
    db: Session = Depends(get_db)
):
    """
    Get entity name suggestions for autocomplete.

    Supports both prefix matching (default) and semantic similarity.

    Examples:
    - Prefix match: ?q=air → Returns ["aircraft", "artillery vehicle"]
    - Semantic: ?q=air&use_semantic=true → Returns ["aircraft", "helicopter", "drone"]
    """
    logger.info(f"Autocomplete request: q='{q}', limit={limit}, use_semantic={use_semantic}, similarity_threshold={similarity_threshold}")
    
    results = SearchService.autocomplete_entities(
        db=db,
        query=q,
        limit=limit,
        use_semantic=use_semantic,
        similarity_threshold=similarity_threshold
    )
    
    logger.info(f"Autocomplete response: {len(results)} suggestions")
    return results


@router.get("/entities/list", response_model=EntityListResponse)
def list_entities(db: Session = Depends(get_db)):
    """
    Get all entities with statistics.

    Returns list of entities with video counts and average presence.
    """
    entities = SearchService.get_entity_statistics(db)

    return EntityListResponse(
        entities=entities,
        total=len(entities)
    )


@router.post("/admin/reindex-entities", response_model=ReindexResponse)
def reindex_all_entities(db: Session = Depends(get_db)):
    """
    Reindex all existing videos for entity search.

    This is a one-time migration endpoint to populate entity tables
    from existing video reports. Should be run after deploying the
    entity search feature.

    **Note**: This may take a while for large video collections.
    """
    result = EntityIndexingService.reindex_all_videos(db)

    return ReindexResponse(
        success=result["success"],
        total_videos=result["total_videos"],
        indexed_count=result["indexed_count"],
        failed_count=result["failed_count"],
        skipped_count=result["skipped_count"],
        total_entities_indexed=result["total_entities_indexed"],
        message=f"Reindex complete: {result['indexed_count']}/{result['total_videos']} videos indexed, "
                f"{result['total_entities_indexed']} total entities indexed"
    )


@router.post("/admin/generate-embeddings")
def generate_embeddings_manual(db: Session = Depends(get_db)):
    """
    Manually trigger embedding generation for all entities.

    This endpoint generates embeddings for entities that don't have them yet.
    Useful for:
    - Initial setup after enabling semantic search
    - Regenerating embeddings after model changes
    - Recovering from failed background generation

    **Note**: This may take a while depending on the number of entities.
    """
    try:
        # Find entities without embeddings
        entities = db.query(Entity).filter(Entity.embedding.is_(None)).all()

        if not entities:
            return {
                "success": True,
                "message": "All entities already have embeddings",
                "total_entities": 0,
                "embeddings_generated": 0,
                "failed": 0
            }

        logger.info(f"Manually generating embeddings for {len(entities)} entities")

        # Process in batches of 50
        batch_size = 50
        successful = 0
        failed = 0

        for i in range(0, len(entities), batch_size):
            batch = entities[i:i + batch_size]
            entity_names = [e.name for e in batch]

            try:
                embeddings = EmbeddingService.generate_embeddings_batch(entity_names, batch_size=batch_size)

                # Update entities with their embeddings
                for entity, embedding in zip(batch, embeddings):
                    entity.embedding = json.dumps(embedding)
                    entity.embedding_model = "mistral-embed"
                    entity.embedding_generated_at = datetime.utcnow()

                db.commit()
                successful += len(batch)
                logger.info(f"Processed batch {i // batch_size + 1}: {successful}/{len(entities)} complete")

            except Exception as e:
                logger.error(f"Failed to generate embeddings for batch: {e}")
                db.rollback()
                failed += len(batch)

        logger.info(f"Manual embedding generation complete: {successful} successful, {failed} failed")

        return {
            "success": True,
            "message": f"Generated embeddings for {successful} entities",
            "total_entities": len(entities),
            "embeddings_generated": successful,
            "failed": failed
        }

    except Exception as e:
        logger.error(f"Error in manual embedding generation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate embeddings: {str(e)}"
        )
