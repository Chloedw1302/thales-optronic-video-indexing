import React from 'react';
import { Sliders, RotateCcw } from 'lucide-react';

export interface SearchFilters {
  operator: 'AND' | 'OR';
  minPresence: number;
  minFrames: number;
  similarityThreshold?: number;
}

interface EntityFilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onReset: () => void;
  isSemanticMode?: boolean;
}

export const EntityFilterPanel: React.FC<EntityFilterPanelProps> = ({
  filters,
  onFiltersChange,
  onReset,
  isSemanticMode = false,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {/* Similarity threshold (semantic mode only) */}
      {isSemanticMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Similarity: {Math.round((filters.similarityThreshold || 0.7) * 100)}%
          </label>
          <input
            type="range"
            min="0.5"
            max="1.0"
            step="0.05"
            value={filters.similarityThreshold || 0.7}
            onChange={(e) =>
              onFiltersChange({ ...filters, similarityThreshold: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Broader (50%)</span>
            <span>Stricter (100%)</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Higher values find more exact semantic matches
          </p>
        </div>
      )}

      {/* Operator toggle (exact mode only) */}
      {!isSemanticMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Match Mode
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onFiltersChange({ ...filters, operator: 'OR' })}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                filters.operator === 'OR'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              OR
              <span className="block text-xs font-normal mt-1">
                Any entity
              </span>
            </button>
            <button
              onClick={() => onFiltersChange({ ...filters, operator: 'AND' })}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                filters.operator === 'AND'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              AND
              <span className="block text-xs font-normal mt-1">
                All entities
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Min presence slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Min Presence: {filters.minPresence}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={filters.minPresence}
          onChange={(e) =>
            onFiltersChange({ ...filters, minPresence: parseInt(e.target.value) })
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Min frames input */}
      <div>
        <label htmlFor="minFrames" className="block text-sm font-medium text-gray-700 mb-2">
          Min Frames
        </label>
        <input
          id="minFrames"
          type="number"
          min="0"
          value={filters.minFrames}
          onChange={(e) =>
            onFiltersChange({ ...filters, minFrames: parseInt(e.target.value) || 0 })
          }
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Minimum number of frames"
        />
        <p className="mt-1 text-xs text-gray-500">
          Only show videos where the entity appears in at least this many frames
        </p>
      </div>
    </div>
  );
};
