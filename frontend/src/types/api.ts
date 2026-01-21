export interface ApiError {
  detail: string;
}

export interface UploadFormData {
  video_file: File;
  voice_file?: File;
  interval_seconds: number;
  process_immediately: boolean;
}
