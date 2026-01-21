import { useState } from 'react';
import { VideoCard } from './VideoCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/ui/button';
import { useVideos } from '@/hooks/useVideos';
import { useDeleteVideo } from '@/hooks/useDeleteVideo';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { VideoStatus } from '@/types/video';

interface VideoListProps {
  statusFilter?: VideoStatus | 'all';
}

export function VideoList({ statusFilter = 'all' }: VideoListProps) {
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isError, error } = useVideos({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit,
  });

  const deleteMutation = useDeleteVideo();

  const handleDelete = (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      deleteMutation.mutate({ videoId, deleteFiles: true });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Failed to load videos"
        message={error instanceof Error ? error.message : 'An error occurred while loading videos'}
      />
    );
  }

  if (!data || data.videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No videos found</p>
        {statusFilter !== 'all' && (
          <p className="text-sm text-muted-foreground mt-2">Try changing the filter</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.videos.map((video) => (
          <VideoCard key={video.id} video={video} onDelete={handleDelete} />
        ))}
      </div>

      {/* Pagination */}
      {data.total_pages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.total)} of {data.total} videos
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-medium px-3 py-2 bg-accent rounded-md">
              Page {page} of {data.total_pages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              disabled={page === data.total_pages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
