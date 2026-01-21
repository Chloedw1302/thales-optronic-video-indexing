import { VideoUploadForm } from '@/components/video/VideoUploadForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function UploadPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Upload Video</h1>
        <p className="text-xl text-muted-foreground">
          Upload a video file to begin automated entity detection and analysis
        </p>
      </div>

      <Card className="hover:scale-[1.01] transition-transform">
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
      <Card>
        <CardHeader>
          <CardTitle>Upload Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <p>
              <strong className="text-primary">Supported Formats:</strong> MP4, MKV, AVI, MOV (maximum 2GB)
            </p>
            <p>
              <strong className="text-primary">Voice Description (Optional):</strong> Upload a text file with descriptions to enhance entity detection
            </p>
            <p>
              <strong className="text-primary">Frame Interval:</strong> Choose how frequently frames should be extracted (1-60 seconds). Lower intervals provide more detailed analysis but take longer to process.
            </p>
            <p>
              <strong className="text-primary">Processing:</strong> Once uploaded, your video will be processed automatically. You can track progress in real-time on the video details page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
