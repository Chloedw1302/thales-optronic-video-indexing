import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { VideoDetails } from '@/components/video/VideoDetails';
import { ProcessingProgress } from '@/components/video/ProcessingProgress';
import { ReportView } from '@/components/video/ReportView';
import { FrameViewer } from '@/components/video/FrameViewer';
import { useVideoDetails } from '@/hooks/useVideoDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function VideoDetailPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const { data: video, isLoading, isError, error } = useVideoDetails(videoId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !video) {
    return (
      <div className="space-y-4">
        <Link to="/videos">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Videos
          </Button>
        </Link>
        <ErrorMessage
          title="Video Not Found"
          message={error instanceof Error ? error.message : 'Failed to load video details'}
        />
      </div>
    );
  }

  const isProcessing = video.status === 'processing' || video.status === 'uploaded';
  const isCompleted = video.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/videos">
        <Button variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Videos
        </Button>
      </Link>

      {/* Video Details */}
      <VideoDetails video={video} />

      {/* Processing Progress (only show while processing) */}
      {isProcessing && videoId && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Processing Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProcessingProgress videoId={videoId} />
          </CardContent>
        </Card>
      )}

      {/* Report and Frames (only show when completed) */}
      {isCompleted && videoId && (
        <>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Analysis Report</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportView videoId={videoId} />
            </CardContent>
          </Card>

          {video.total_frames_analyzed && video.total_frames_analyzed > 0 && (
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>Frame Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <FrameViewer
                  videoId={videoId}
                  totalFrames={video.total_frames_analyzed}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
