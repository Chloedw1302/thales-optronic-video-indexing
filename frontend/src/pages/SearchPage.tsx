import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search as SearchIcon, AlertCircle, Loader2, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { EntityFilterPanel } from '../components/search/EntityFilterPanel';
import { SearchResultCard } from '../components/search/SearchResultCard';
import { searchApi } from '../api/search';
import type { SearchFilters } from '../components/search/EntityFilterPanel';
import type { UnifiedSearchResponse, EntityAutocompleteItem } from '../api/search';
import { MIN_SEARCH_QUERY_LENGTH, MIN_AUTOCOMPLETE_QUERY_LENGTH } from '../utils/constants';
import { useLocation } from 'react-router-dom';

const DEFAULT_FILTERS: SearchFilters = {
  operator: 'OR',
  minPresence: 0,
  minFrames: 0,
  similarityThreshold: 0.7,
};

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [searchResults, setSearchResults] = useState<UnifiedSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Handle location state for homepage navigation
  const location = useLocation();
  
  // Autocomplete state
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<EntityAutocompleteItem[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Fetch autocomplete suggestions
  useEffect(() => {
    const fetchAutocomplete = async () => {
      const trimmedQuery = query.trim();
      
      // Don't show autocomplete for very short queries
      if (trimmedQuery.length < MIN_AUTOCOMPLETE_QUERY_LENGTH) {
        setAutocompleteSuggestions([]);
        return;
      }

      try {
        // Fetch autocomplete suggestions
        const results = await searchApi.autocompleteEntities(
          trimmedQuery,
          10,
          false,
          0.6
        );
        
        setAutocompleteSuggestions(results);
      } catch (error) {
        console.error('Error fetching autocomplete:', error);
        setAutocompleteSuggestions([]);
      }
    };

    const timer = setTimeout(fetchAutocomplete, 300); // Debounce
    return () => clearTimeout(timer);
  }, [query]);

  // Handle click outside autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = useCallback(async (page: number = 1) => {
    // Check if we have valid search criteria
    const trimmedQuery = query.trim();
    const hasValidCriteria = trimmedQuery.length > 0;

    if (!hasValidCriteria) {
      setSearchResults(null);
      setHasSearched(false);
      return;
    }

    // Don't search for very short queries - let autocomplete handle it
    if (trimmedQuery.length < MIN_AUTOCOMPLETE_QUERY_LENGTH) {
      setSearchResults(null);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      if (trimmedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
        // For short queries, use autocomplete to find exact entity matches
        const autocompleteResults = await searchApi.autocompleteEntities(trimmedQuery, 10, false);
        
        if (autocompleteResults.length > 0) {
          // Use regular entity search with autocomplete results
          const entityNames = autocompleteResults.map(item => item.name);
          const results = await searchApi.searchEntities({
            entities: entityNames,
            operator: filters.operator || 'OR',
            min_presence: filters.minPresence > 0 ? filters.minPresence : undefined,
            min_frames: filters.minFrames > 0 ? filters.minFrames : undefined,
            page,
            limit: 20,
          });
          
          // Convert to unified search response format for consistency
          setSearchResults({
            ...results,
            exact_match_results: results.total,
            semantic_match_results: 0,
            matched_entities: [],
            search_params: {
              query: trimmedQuery,
              similarity_threshold: 0.7,
              top_k: 10,
              min_presence: filters.minPresence > 0 ? filters.minPresence : undefined,
              min_frames: filters.minFrames > 0 ? filters.minFrames : undefined,
              sort_by: 'created_at',
              order: 'desc',
            },
          });
        } else {
          // No autocomplete results found
          setSearchResults({
            results: [],
            total: 0,
            page: 1,
            limit: 20,
            total_pages: 1,
            exact_match_results: 0,
            semantic_match_results: 0,
            matched_entities: [],
            search_params: {
              query: trimmedQuery,
              similarity_threshold: 0.7,
              top_k: 10,
              min_presence: filters.minPresence > 0 ? filters.minPresence : undefined,
              min_frames: filters.minFrames > 0 ? filters.minFrames : undefined,
              sort_by: 'created_at',
              order: 'desc',
            },
          });
        }
      } else {
        // For longer queries, use unified semantic search
        const results = await searchApi.searchEntitiesUnified({
          query: trimmedQuery,
          similarity_threshold: filters.similarityThreshold || 0.7,
          top_k: 10,
          min_presence: filters.minPresence > 0 ? filters.minPresence : undefined,
          min_frames: filters.minFrames > 0 ? filters.minFrames : undefined,
          page,
          limit: 20,
        });
        setSearchResults(results);
      }
      setCurrentPage(page);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search videos. Please try again.');
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [query, filters]);

  // Handle initial query from homepage navigation
  useEffect(() => {
    if (location.state?.query && location.state.fromHome) {
      setQuery(location.state.query);
      // Clear the state to avoid re-triggering on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto-search when search criteria or filters change
  useEffect(() => {
    const hasValidCriteria = query.trim().length > 0;

    if (hasValidCriteria) {
      performSearch(1);
    } else {
      setSearchResults(null);
      setHasSearched(false);
    }
  }, [query, filters]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handlePageChange = (newPage: number) => {
    performSearch(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSuggestion = (suggestion: EntityAutocompleteItem) => {
    setQuery(suggestion.name);
    setShowAutocomplete(false);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showAutocomplete || autocompleteSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => 
        Math.min(prev + 1, autocompleteSuggestions.length - 1)
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(autocompleteSuggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <SearchIcon className="h-8 w-8 text-blue-600" />
            Unified Entity Search
          </h1>
          <p className="mt-2 text-gray-600">
            Search for videos using entity names or natural language. The system automatically
            combines exact matches with AI-powered semantic search for comprehensive results.
          </p>
        </div>

        {/* Unified search input */}
        <div className="mb-6">
          <div className="relative">
            {/* <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div> */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowAutocomplete(true);
                setSelectedSuggestionIndex(-1);
              }}
              onFocus={() => setShowAutocomplete(true)}
              onKeyDown={handleInputKeyDown}
              placeholder="e.g., aircraft, tanks in the sky, military personnel with drones..."
              className="block w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Autocomplete suggestions dropdown */}
            {showAutocomplete && autocompleteSuggestions.length > 0 && (
              <div
                ref={autocompleteRef}
                className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-400 rounded-lg shadow-lg max-h-80 overflow-auto"
              >
                <div className="px-4 py-2 text-xs font-medium text-gray-600 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                  Autocomplete suggestions ({autocompleteSuggestions.length} found)
                </div>
                <div className="py-1">
                  {autocompleteSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 flex items-center justify-between border-b border-gray-100 last:border-b-0 transition-colors ${
                        index === selectedSuggestionIndex ? 'bg-blue-100' : ''
                      }`}
                    >
                      <span className="font-medium text-gray-900">{suggestion.name}</span>
                      {suggestion.video_count !== undefined && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {suggestion.video_count} video{suggestion.video_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Enter entity names (comma-separated) or natural language queries. 
            {query.trim().length > 0 && query.trim().length < MIN_SEARCH_QUERY_LENGTH ? 
              ' Type more characters to see autocomplete suggestions or press Enter to search.' : 
              ' Short queries will search for exact entity matches, while longer queries will use AI-powered semantic search for enhanced results.'
            }
          </p>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters sidebar */}
          <div className="lg:col-span-1">
            <EntityFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onReset={handleResetFilters}
              isSemanticMode={true}  // Always show similarity threshold for unified search
            />
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Searching...</span>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Empty state - no search performed */}
            {!hasSearched && !isLoading && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <SearchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start searching
                </h3>
                <p className="text-gray-600">
                  Enter one or more entity names above to search for videos
                </p>
              </div>
            )}

            {/* No results */}
            {hasSearched && !isLoading && searchResults && searchResults.total === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or filters
                </p>
              </div>
            )}

            {/* Results */}
            {!isLoading && searchResults && searchResults.total > 0 && (
              <>
                {/* Search summary (unified search) */}
                {searchResults && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <SearchIcon className="h-5 w-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-blue-900">
                        Unified Search Results
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">
                          Exact Matches
                        </p>
                        <p className="text-2xl font-bold text-blue-800">
                          {searchResults.exact_match_results}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">
                          AI Enhancements
                        </p>
                        <p className="text-2xl font-bold text-blue-800">
                          {searchResults.semantic_match_results}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">
                          Total Unique Videos
                        </p>
                        <p className="text-2xl font-bold text-blue-800">
                          {searchResults.total}
                        </p>
                      </div>
                    </div>
                    
                    {/* Matched entities from semantic search */}
                    {searchResults.matched_entities.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-100">
                        <p className="text-xs text-blue-600 uppercase tracking-wide mb-2">
                          Found Similar Entities:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {searchResults.matched_entities.map((entity) => (
                            <div
                              key={entity.entity_name}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 rounded-full text-sm"
                            >
                              <span className="font-medium text-gray-900">{entity.entity_name}</span>
                              <span className="text-xs text-blue-600 font-semibold">
                                {Math.round(entity.similarity_score * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-blue-700">
                          These entities were found via semantic similarity and used to enhance your search results
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Results header */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-gray-700">
                    Found <span className="font-semibold">{searchResults.total}</span> unique video
                    {searchResults.total !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    Page {searchResults.page} of {searchResults.total_pages}
                  </p>
                </div>

                {/* Results grid */}
                <div className="space-y-4">
                  {searchResults.results.map((result) => (
                    <SearchResultCard key={result.id} result={result} />
                  ))}
                </div>

                {/* Pagination */}
                {searchResults.total_pages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                      Page {currentPage} of {searchResults.total_pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === searchResults.total_pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
