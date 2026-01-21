import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Clock, FileVideo, Calendar } from 'lucide-react';
import type { EntitySearchResult } from '../../api/search';

interface SearchResultCardProps {
  result: EntitySearchResult;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ result }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      onClick={() => navigate(`/videos/${result.id}`)}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Video className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{result.filename}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(result.created_at)}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
          {result.status}
        </span>
      </div>

      {/* Video info */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{formatDuration(result.duration_seconds)}</span>
        </div>
        <div className="flex items-center gap-1">
          <FileVideo className="h-4 w-4" />
          <span>{result.total_frames_analyzed || 0} frames</span>
        </div>
      </div>

      {/* Matched entities */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Matched Entities:</p>
        <div className="flex flex-wrap gap-2">
          {result.matched_entities.map((entity) => (
            <div
              key={entity.entity_id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg"
            >
              <span className="font-medium text-blue-900">{entity.entity_name}</span>
              <span className="text-xs text-blue-700 font-semibold">
                {entity.presence_percentage.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">
                ({entity.frames_with_entity} frames)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Click to view hint */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Click to view full video details and timeline
        </p>
      </div>
    </div>
  );
};
