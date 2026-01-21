"""
Search-related schemas for entity search functionality.
"""
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class EntityMatchInfo(BaseModel):
    """Information about an entity match in a video."""
    entity_id: str
    entity_name: str
    frames_with_entity: int
    total_frames_analyzed: int
    presence_percentage: float
    first_appearance_second: Optional[float] = None
    last_appearance_second: Optional[float] = None

    @field_validator('entity_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string."""
        return str(v) if isinstance(v, UUID) else v

    class Config:
        from_attributes = True


class EntityMatchInfoWithSimilarity(EntityMatchInfo):
    """Entity match info with semantic similarity score."""
    similarity_score: Optional[float] = Field(None, description="Cosine similarity score (0-1)")


class EntitySearchResult(BaseModel):
    """A video in search results with matched entity details."""
    id: str
    filename: str
    status: str
    duration_seconds: Optional[float] = None
    total_frames_analyzed: Optional[int] = None
    unique_entities_count: Optional[int] = None
    created_at: datetime
    processed_at: Optional[datetime] = None
    matched_entities: List[EntityMatchInfo]

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string."""
        return str(v) if isinstance(v, UUID) else v

    class Config:
        from_attributes = True


class EntitySearchResponse(BaseModel):
    """Paginated entity search results."""
    results: List[EntitySearchResult]
    total: int
    page: int
    limit: int
    total_pages: int
    search_params: dict


class MatchedEntityWithSimilarity(BaseModel):
    """Entity name with similarity score."""
    entity_name: str
    similarity_score: float = Field(..., description="Cosine similarity score (0-1)")


class SemanticSearchResponse(BaseModel):
    """Semantic search results with similarity information."""
    results: List[EntitySearchResult]
    total: int
    page: int
    limit: int
    total_pages: int
    matched_entities: List[MatchedEntityWithSimilarity] = Field(
        ..., description="Entities found via semantic similarity"
    )
    search_params: dict


class EntityAutocompleteItem(BaseModel):
    """Entity name suggestion for autocomplete."""
    id: str
    name: str
    video_count: Optional[int] = None

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string."""
        return str(v) if isinstance(v, UUID) else v

    class Config:
        from_attributes = True


class EntityStatistics(BaseModel):
    """Statistics for an entity across all videos."""
    id: str
    name: str
    category: Optional[str] = None
    video_count: int
    total_appearances: int
    avg_presence_percentage: float
    created_at: datetime

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string."""
        return str(v) if isinstance(v, UUID) else v

    class Config:
        from_attributes = True


class UnifiedSearchResponse(BaseModel):
    """Unified search results combining exact and semantic search."""
    results: List[EntitySearchResult]
    total: int
    page: int
    limit: int
    total_pages: int
    exact_match_results: int = Field(..., description="Number of results from exact search")
    semantic_match_results: int = Field(..., description="Number of results from semantic search")
    matched_entities: List[MatchedEntityWithSimilarity] = Field(
        default=[], description="Entities found via semantic similarity"
    )
    search_params: dict


class EntityListResponse(BaseModel):
    """List of all entities with statistics."""
    entities: List[EntityStatistics]
    total: int


class ReindexResponse(BaseModel):
    """Response from reindex operation."""
    success: bool
    total_videos: int
    indexed_count: int
    failed_count: int
    skipped_count: int
    total_entities_indexed: int
    message: str
