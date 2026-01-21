import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { searchApi } from '../../api/search';
import type { EntityAutocompleteItem } from '../../api/search';
import { MIN_AUTOCOMPLETE_QUERY_LENGTH, MIN_SEMANTIC_AUTOCOMPLETE_LENGTH } from '../../utils/constants';

interface EntitySearchBarProps {
  selectedEntities: string[];
  onEntitiesChange: (entities: string[]) => void;
  placeholder?: string;
  useSemantic?: boolean;
}

export const EntitySearchBar: React.FC<EntitySearchBarProps> = ({
  selectedEntities,
  onEntitiesChange,
  placeholder = 'Search for entities (e.g., aircraft, drone, military personnel)...',
  useSemantic = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<EntityAutocompleteItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch autocomplete suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmedQuery = inputValue.trim();
      
      console.log(`Autocomplete useEffect triggered. Input: "${inputValue}", trimmed: "${trimmedQuery}", length: ${trimmedQuery.length}`);
      
      // Don't show suggestions for very short queries
      if (trimmedQuery.length < MIN_AUTOCOMPLETE_QUERY_LENGTH) {
        console.log(`Query too short (${trimmedQuery.length} < ${MIN_AUTOCOMPLETE_QUERY_LENGTH}), clearing suggestions`);
        setSuggestions([]);
        return;
      }

      try {
        // For semantic autocomplete, require minimum length and use higher threshold for short queries
        const canUseSemantic = useSemantic && trimmedQuery.length >= MIN_SEMANTIC_AUTOCOMPLETE_LENGTH;
        
        // For semantic autocomplete, use higher threshold for short queries
        const similarityThreshold = canUseSemantic ? 
          (trimmedQuery.length <= 3 ? 0.8 : trimmedQuery.length <= 5 ? 0.7 : 0.6) : 0.6;
        
        console.log(`Fetching autocomplete for "${trimmedQuery}" (semantic: ${canUseSemantic}, threshold: ${similarityThreshold})`);
        
        const results = await searchApi.autocompleteEntities(
          trimmedQuery,
          10,
          canUseSemantic,
          similarityThreshold
        );
        
        console.log(`Received ${results.length} autocomplete results:`, results);
        
        // Filter out already selected entities
        const filtered = results.filter(
          (item) => !selectedEntities.includes(item.name)
        );
        
        console.log(`Filtered to ${filtered.length} suggestions after removing selected entities`);
        setSuggestions(filtered);
        console.log(`Suggestions state updated. showSuggestions: ${showSuggestions}, suggestions.length: ${filtered.length}`);
      } catch (error) {
        console.error('Error fetching autocomplete:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error setting up request:', error.message);
        }
        setSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300); // Debounce
    return () => clearTimeout(timer);
  }, [inputValue, selectedEntities, useSemantic]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addEntity = (entityName: string) => {
    if (!selectedEntities.includes(entityName)) {
      onEntitiesChange([...selectedEntities, entityName]);
    }
    setInputValue('');
    setSuggestions([]);
    setSelectedIndex(-1);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeEntity = (entityName: string) => {
    onEntitiesChange(selectedEntities.filter((e) => e !== entityName));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addEntity(suggestions[selectedIndex].name);
      } else if (inputValue.trim()) {
        addEntity(inputValue.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  console.log(`EntitySearchBar render: inputValue="${inputValue}", showSuggestions=${showSuggestions}, suggestions.length=${suggestions.length}`);

  return (
    <div className="w-full">
      <div className="relative">
        {/* Selected entities chips */}
        {selectedEntities.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedEntities.map((entity) => (
              <span
                key={entity}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {entity}
                <button
                  onClick={() => removeEntity(entity)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                  aria-label={`Remove ${entity}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Autocomplete suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-500 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            <div className="px-4 py-2 text-xs text-gray-500 bg-blue-50 border-b border-blue-200">
              {useSemantic ? 'Semantic suggestions' : 'Entity suggestions'} ({suggestions.length} results)
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => addEntity(suggestion.name)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between ${
                  index === selectedIndex ? 'bg-gray-100' : ''
                }`}
              >
                <span className="font-medium">{suggestion.name}</span>
                {suggestion.video_count !== undefined && (
                  <span className="text-sm text-gray-500">
                    {suggestion.video_count} video{suggestion.video_count !== 1 ? 's' : ''}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        
        {/* Show hint when no suggestions but query is long enough */}
        {showSuggestions && suggestions.length === 0 && inputValue.trim().length >= MIN_AUTOCOMPLETE_QUERY_LENGTH && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
            <p className="text-sm text-gray-600">
              {useSemantic ? 
                'No semantic suggestions found. Try different keywords or use prefix matching.' : 
                'No entity suggestions found. Try different keywords.'
              }
            </p>
            {useSemantic && inputValue.trim().length >= MIN_SEMANTIC_AUTOCOMPLETE_LENGTH && (
              <button
                onClick={() => {
                  // Switch to prefix matching if semantic search fails
                  onEntitiesChange([inputValue.trim()]);
                  setInputValue('');
                  setShowSuggestions(false);
                }}
                className="mt-3 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
              >
                Search anyway
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
