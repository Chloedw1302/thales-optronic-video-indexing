import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useUploadVideo } from '@/hooks/useUploadVideo';
import { validateVideoFile, validateVoiceFile } from '@/utils/validators';
import { formatFileSize } from '@/utils/formatters';
import { DEFAULT_INTERVAL_SECONDS, MIN_INTERVAL_SECONDS, MAX_INTERVAL_SECONDS } from '@/utils/constants';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export function VideoUploadForm() {
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [intervalSeconds, setIntervalSeconds] = useState(DEFAULT_INTERVAL_SECONDS);
  const [errors, setErrors] = useState<{ video?: string; voice?: string }>({});

  const uploadMutation = useUploadVideo();

  const onDropVideo = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const error = validateVideoFile(file);
      if (error) {
        setErrors((prev) => ({ ...prev, video: error }));
      } else {
        setVideoFile(file);
        setErrors((prev) => ({ ...prev, video: undefined }));
      }
    }
  };

  const onDropVoice = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const error = validateVoiceFile(file);
      if (error) {
        setErrors((prev) => ({ ...prev, voice: error }));
      } else {
        setVoiceFile(file);
        setErrors((prev) => ({ ...prev, voice: undefined }));
      }
    }
  };

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } = useDropzone({
    onDrop: onDropVideo,
    accept: { 'video/*': ['.mp4', '.mkv', '.avi', '.mov'] },
    maxFiles: 1,
    multiple: false,
  });

  const { getRootProps: getVoiceRootProps, getInputProps: getVoiceInputProps, isDragActive: isVoiceDragActive } = useDropzone({
    onDrop: onDropVoice,
    accept: { 'text/plain': ['.txt'] },
    maxFiles: 1,
    multiple: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile) {
      setErrors({ video: 'Please select a video file' });
      return;
    }

    const formData = new FormData();
    formData.append('video_file', videoFile);
    if (voiceFile) {
      formData.append('voice_file', voiceFile);
    }
    formData.append('interval_seconds', intervalSeconds.toString());
    formData.append('process_immediately', 'true');

    uploadMutation.mutate(formData, {
      onSuccess: (data) => {
        navigate(`/videos/${data.video_id}`);
      },
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
        <CardDescription>
          Upload a video file for processing. Optionally include a voice description file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Video File *</label>
            <div
              {...getVideoRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isVideoDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              <input {...getVideoInputProps()} />
              {videoFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="h-6 w-6 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{videoFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(videoFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoFile(null);
                    }}
                    className="hover:bg-red-500/10"
                  >
                    <X className="h-5 w-5 text-red-400" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-10 w-10 mx-auto text-primary" />
                  <p className="text-sm">
                    <span className="font-medium text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">MP4, MKV, AVI, MOV (max 2GB)</p>
                </div>
              )}
            </div>
            {errors.video && (
              <div className="flex items-center space-x-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.video}</span>
              </div>
            )}
          </div>

          {/* Voice File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Voice Description File (Optional)</label>
            <div
              {...getVoiceRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isVoiceDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              <input {...getVoiceInputProps()} />
              {voiceFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{voiceFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(voiceFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVoiceFile(null);
                    }}
                    className="hover:bg-red-500/10"
                  >
                    <X className="h-5 w-5 text-red-400" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-primary" />
                  <p className="text-sm">Drop voice description file or click to browse</p>
                  <p className="text-xs text-muted-foreground">TXT (max 10MB)</p>
                </div>
              )}
            </div>
            {errors.voice && (
              <div className="flex items-center space-x-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.voice}</span>
              </div>
            )}
          </div>

          {/* Interval Seconds */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Frame Extraction Interval (seconds)</label>
            <div className="flex items-center space-x-4">
              <Input
                type="range"
                min={MIN_INTERVAL_SECONDS}
                max={MAX_INTERVAL_SECONDS}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                className="flex-1"
              />
              <Input
                type="number"
                min={MIN_INTERVAL_SECONDS}
                max={MAX_INTERVAL_SECONDS}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                className="w-20"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Extract one frame every {intervalSeconds} second{intervalSeconds !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Error Message */}
          {uploadMutation.isError && (
            <ErrorMessage
              title="Upload Failed"
              message={uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Failed to upload video'}
            />
          )}

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>Processing will start automatically</span>
              </div>
              <Progress value={undefined} className="animate-pulse h-2" />
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" variant="gradient" disabled={uploadMutation.isPending || !videoFile}>
            {uploadMutation.isPending ? 'Uploading...' : 'Upload and Process'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
