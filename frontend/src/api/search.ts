import { apiClient } from './client';

export interface EntityMatchInfo {
  entity_id: string;
  entity_name: string;
  frames_with_entity: number;
  total_frames_analyzed: number;
  presence_percentage: number;
  first_appearance_second?: number;
  last_appearance_second?: number;
}

export interface EntitySearchResult {
  id: string;
  filename: string;
  status: string;
  duration_seconds?: number;
  total_frames_analyzed?: number;
  unique_entities_count?: number;
  created_at: string;
  processed_at?: string;
  matched_entities: EntityMatchInfo[];
}

export interface EntitySearchResponse {
  results: EntitySearchResult[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  search_params: {
    entities: string[];
    operator: string;
    min_presence?: number;
    min_frames?: number;
    status?: string;
    sort_by: string;
    order: string;
  };
}

export interface EntityAutocompleteItem {
  id: string;
  name: string;
  video_count?: number;
}

export interface EntityStatistics {
  id: string;
  name: string;
  category?: string;
  video_count: number;
  total_appearances: number;
  avg_presence_percentage: number;
  created_at: string;
}

export interface EntityListResponse {
  entities: EntityStatistics[];
  total: number;
}

export interface ReindexResponse {
  success: boolean;
  total_videos: number;
  indexed_count: number;
  failed_count: number;
  skipped_count: number;
  total_entities_indexed: number;
  message: string;
}

// Unified search response
export interface UnifiedSearchResponse {
  results: EntitySearchResult[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  exact_match_results: number;
  semantic_match_results: number;
  matched_entities: MatchedEntityWithSimilarity[];
  search_params: {
    query: string;
    similarity_threshold: number;
    top_k: number;
    min_presence?: number;
    min_frames?: number;
    status?: string;
    sort_by: string;
    order: string;
  };
}

export interface MatchedEntityWithSimilarity {
  entity_name: string;
  similarity_score: number;
}

export interface SemanticSearchResponse {
  results: EntitySearchResult[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  matched_entities: MatchedEntityWithSimilarity[];
  search_params: {
    query: string;
    similarity_threshold: number;
    top_k: number;
    min_presence?: number;
    min_frames?: number;
    status?: string;
    sort_by: string;
    order: string;
  };
}

export const searchApi = {
  // Search for videos by entities
  searchEntities: async (params: {
    entities: string[];
    operator?: 'AND' | 'OR';
    min_presence?: number;
    min_frames?: number;
    status?: string;
    sort_by?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<EntitySearchResponse> => {
    const { data } = await apiClient.get('/search/entities', {
      params: {
        entities: params.entities.join(','),
        operator: params.operator || 'OR',
        min_presence: params.min_presence,
        min_frames: params.min_frames,
        status: params.status,
        sort_by: params.sort_by || 'created_at',
        order: params.order || 'desc',
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });
    return data;
  },

  // Autocomplete entity names
  autocompleteEntities: async (
    query: string,
    limit: number = 10,
    useSemantic: boolean = false,
    similarityThreshold: number = 0.6
  ): Promise<EntityAutocompleteItem[]> => {
    const { data } = await apiClient.get('/search/entities/autocomplete', {
      params: {
        q: query,
        limit,
        use_semantic: useSemantic,
        similarity_threshold: similarityThreshold,
      },
    });
    return data;
  },

  // Semantic search for videos
  searchEntitiesSemantic: async (params: {
    query: string;
    similarity_threshold?: number;
    top_k?: number;
    min_presence?: number;
    min_frames?: number;
    status?: string;
    sort_by?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<SemanticSearchResponse> => {
    const { data } = await apiClient.get('/search/entities/semantic', {
      params: {
        query: params.query,
        similarity_threshold: params.similarity_threshold || 0.7,
        top_k: params.top_k || 10,
        min_presence: params.min_presence,
        min_frames: params.min_frames,
        status: params.status,
        sort_by: params.sort_by || 'created_at',
        order: params.order || 'desc',
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });
    return data;
  },

  // Get all entities with statistics
  listEntities: async (): Promise<EntityListResponse> => {
    const { data } = await apiClient.get('/search/entities/list');
    return data;
  },

  // Reindex all videos (admin)
  reindexEntities: async (): Promise<ReindexResponse> => {
    const { data } = await apiClient.post('/search/admin/reindex-entities');
    return data;
  },

  // Generate embeddings for entities (admin)
  generateEmbeddings: async (): Promise<{
    success: boolean;
    message: string;
    total_entities: number;
    embeddings_generated: number;
    failed: number;
  }> => {
    const { data } = await apiClient.post('/search/admin/generate-embeddings');
    return data;
  },

  // Unified search that combines exact and semantic search
  searchEntitiesUnified: async (params: {
    query: string;
    similarity_threshold?: number;
    top_k?: number;
    min_presence?: number;
    min_frames?: number;
    status?: string;
    sort_by?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<UnifiedSearchResponse> => {
    const { data } = await apiClient.get('/search/entities/unified', {
      params: {
        query: params.query,
        similarity_threshold: params.similarity_threshold || 0.7,
        top_k: params.top_k || 10,
        min_presence: params.min_presence,
        min_frames: params.min_frames,
        status: params.status,
        sort_by: params.sort_by || 'created_at',
        order: params.order || 'desc',
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });
    return data;
  },
};
