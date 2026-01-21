import { Link } from 'react-router-dom';
import { Trash2, Eye, Clock, Film } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, formatDuration } from '@/utils/formatters';
import type { Video } from '@/types/video';

interface VideoCardProps {
  video: Video;
  onDelete: (videoId: string) => void;
}

export function VideoCard({ video, onDelete }: VideoCardProps) {
  return (
    <Card className="hover:scale-[1.02] transition-transform">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{video.original_filename}</h3>
            <p className="text-sm text-muted-foreground">{formatDate(video.created_at)}</p>
          </div>
          <StatusBadge status={video.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          {video.duration_seconds !== null && (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(video.duration_seconds)}</span>
            </div>
          )}
          {video.total_frames_analyzed !== null && (
            <div className="flex items-center space-x-1">
              <Film className="h-4 w-4" />
              <span>{video.total_frames_analyzed} frames</span>
            </div>
          )}
        </div>

        {video.unique_entities_count !== null && video.unique_entities_count > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Entities found: </span>
            <span className="font-medium text-primary">{video.unique_entities_count}</span>
          </div>
        )}

        {video.has_voice_file && (
          <div className="inline-flex items-center px-2 py-1 rounded-md bg-blue-900/20 border border-blue-500/30 text-xs text-blue-300">
            Voice description included
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end space-x-2 pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(video.id)}
          className="text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
        <Link to={`/videos/${video.id}`}>
          <Button size="sm" variant="gradient">
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
