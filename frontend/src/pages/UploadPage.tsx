import { VideoUploadForm } from '@/components/video/VideoUploadForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function UploadPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Upload Video</h1>
        <p className="text-foreground-muted">
          Upload a video file to begin automated entity detection and analysis
        </p>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Video Upload</CardTitle>
          <CardDescription>
            Drag and drop your video file or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VideoUploadForm />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Upload Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm text-foreground-muted">
            <p>
              <strong className="text-foreground font-medium">Supported Formats:</strong> MP4, MKV, AVI, MOV (maximum 2GB)
            </p>
            <p>
              <strong className="text-foreground font-medium">Voice Description (Optional):</strong> Upload a text file with descriptions to enhance entity detection
            </p>
            <p>
              <strong className="text-foreground font-medium">Frame Interval:</strong> Choose how frequently frames should be extracted (1-60 seconds). Lower intervals provide more detailed analysis but take longer to process.
            </p>
            <p>
              <strong className="text-foreground font-medium">Processing:</strong> Once uploaded, your video will be processed automatically. You can track progress in real-time on the video details page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
