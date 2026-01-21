import { Download, Clock, Film, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, formatDuration } from '@/utils/formatters';
import { videosApi } from '@/api/videos';
import type { VideoDetail } from '@/types/video';

interface VideoDetailsProps {
  video: VideoDetail;
}

export function VideoDetails({ video }: VideoDetailsProps) {
  const handleDownloadVideo = () => {
    window.open(videosApi.downloadVideo(video.id), '_blank');
  };

  const handleDownloadReport = () => {
    if (video.status === 'completed') {
      window.open(videosApi.downloadReport(video.id), '_blank');
    }
  };

  return (
    <Card className="hover:scale-[1.01] transition-transform">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{video.original_filename}</CardTitle>
            <p className="text-sm text-muted-foreground">ID: {video.id}</p>
          </div>
          <StatusBadge status={video.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Uploaded</p>
            <p className="text-sm text-muted-foreground">{formatDate(video.created_at)}</p>
          </div>

          {video.processed_at && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Processed</p>
              <p className="text-sm text-muted-foreground">{formatDate(video.processed_at)}</p>
            </div>
          )}

          {video.duration_seconds !== null && (
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Duration</span>
              </p>
              <p className="text-sm text-muted-foreground">{formatDuration(video.duration_seconds)}</p>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium">Interval</p>
            <p className="text-sm text-muted-foreground">{video.interval_seconds} seconds</p>
          </div>

          {video.total_frames_analyzed !== null && (
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center space-x-1">
                <Film className="h-4 w-4" />
                <span>Frames Analyzed</span>
              </p>
              <p className="text-sm text-muted-foreground">{video.total_frames_analyzed}</p>
            </div>
          )}

          {video.unique_entities_count !== null && (
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center space-x-1">
                <Hash className="h-4 w-4" />
                <span>Unique Entities</span>
              </p>
              <p className="text-sm text-muted-foreground">{video.unique_entities_count}</p>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium">Voice File</p>
            <p className="text-sm text-muted-foreground">
              {video.has_voice_file ? 'Included' : 'Not included'}
            </p>
          </div>
        </div>

        {/* Download Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDownloadVideo} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Video
          </Button>
          {video.status === 'completed' && video.report_path && (
            <Button onClick={handleDownloadReport} variant="gradient">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          )}
        </div>

        {/* Error Message */}
        {video.error_message && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-sm font-medium text-red-400">Error</p>
            <p className="text-sm text-red-300 mt-1">{video.error_message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
