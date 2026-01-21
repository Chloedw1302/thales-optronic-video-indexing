import { useVideoStatus } from '@/hooks/useVideoStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { formatPercentage } from '@/utils/formatters';

interface ProcessingProgressProps {
  videoId: string;
}

export function ProcessingProgress({ videoId }: ProcessingProgressProps) {
  const { data: status, isLoading, isError } = useVideoStatus(videoId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (isError || !status) {
    return (
      <ErrorMessage
        title="Status Update Failed"
        message="Unable to fetch processing status"
      />
    );
  }

  const isProcessing = status.status === 'processing' || status.status === 'uploaded';
  const isCompleted = status.status === 'completed';
  const isFailed = status.status === 'failed';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {isProcessing && <LoadingSpinner size="sm" />}
          {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {isFailed && <AlertCircle className="h-5 w-5 text-red-500" />}
          <span>
            {isProcessing && 'Processing Video'}
            {isCompleted && 'Processing Complete'}
            {isFailed && 'Processing Failed'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isProcessing && (
          <>
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{formatPercentage(status.progress_percentage)}</span>
              </div>
              <Progress value={status.progress_percentage || 0} />
            </div>

            {/* Current Stage */}
            {status.current_stage && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Current Stage</p>
                <p className="text-sm text-muted-foreground">{status.current_stage}</p>
              </div>
            )}

            {/* Progress Message */}
            {status.progress_message && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">{status.progress_message}</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground italic">
              Automatically refreshing every 1.5 seconds...
            </div>
          </>
        )}

        {isCompleted && (
          <div className="text-sm text-muted-foreground">
            Video processing completed successfully. View the report below.
          </div>
        )}

        {isFailed && status.error_message && (
          <div className="text-sm text-destructive">
            {status.error_message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
