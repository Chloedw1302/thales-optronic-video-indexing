import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../../api/search';
import type { EntityAutocompleteItem } from '../../api/search';
import { MIN_AUTOCOMPLETE_QUERY_LENGTH } from '../../utils/constants';

interface HomeSearchProps {
  className?: string;
}

export const HomeSearch: React.FC<HomeSearchProps> = ({ className = '' }) => {
  const [query, setQuery] = useState<string>('');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<EntityAutocompleteItem[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const navigate = useNavigate();
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
          5,
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

  const handleSearch = useCallback(() => {
    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length === 0) {
      return;
    }

    // Navigate to search page with the query
    navigate('/search', {
      state: { 
        query: trimmedQuery,
        fromHome: true
      }
    });
  }, [query, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else {
      handleInputKeyDown(e);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <div className="relative">
          {/* <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
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
            onKeyDown={handleKeyDown}
            placeholder="Search for entities, objects, or scenes..."
            className="block w-full pl-14 pr-4 py-4 text-lg border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:shadow-md transition-shadow"
          />
          
          {/* <button
            onClick={handleSearch}
            disabled={query.trim().length === 0}
            className="absolute right-2 top-2 p-2 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <SearchIcon className="h-6 w-6 text-blue-600" />
          </button> */}
        </div>

        {/* Autocomplete suggestions dropdown */}
        {showAutocomplete && autocompleteSuggestions.length > 0 && (
          <div
            ref={autocompleteRef}
            className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-400 rounded-lg shadow-lg max-h-80 overflow-auto"
          >
            <div className="px-4 py-2 text-xs font-medium text-gray-600 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              Quick suggestions ({autocompleteSuggestions.length} found)
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

      {/* Search examples */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Try: "aircraft", "military personnel", "drones"
        </span>
        {/* <span className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Or: "tanks in the sky", "soldiers with equipment"
        </span> */}
      </div>
    </div>
  );
};