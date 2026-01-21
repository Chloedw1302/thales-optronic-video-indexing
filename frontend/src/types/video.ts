export type VideoStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

export interface Video {
  id: string;
  filename: string;
  original_filename: string;
  status: VideoStatus;
  has_voice_file: boolean;
  duration_seconds: number | null;
  total_frames_analyzed: number | null;
  unique_entities_count: number | null;
  created_at: string;
  processed_at: string | null;
}

export interface VideoDetail extends Video {
  video_path: string;
  voice_path: string | null;
  interval_seconds: number;
  current_stage: string | null;
  progress_percentage: number | null;
  progress_message: string | null;
  report_path: string | null;
  frames_directory: string | null;
  error_message: string | null;
  updated_at: string;
}

export interface VideoStatusResponse {
  video_id: string;
  status: VideoStatus;
  progress_percentage: number | null;
  current_stage: string | null;
  progress_message: string | null;
  error_message: string | null;
}

export interface VideoReport {
  video_id: string;
  filename: string;
  duration_seconds: number;
  total_frames_analyzed: number;
  interval_seconds: number;
  unique_entities: string[];
  entity_appearances: Record<string, any>;
  timeline: any[];
  statistics: Record<string, any>;
  consolidated_timeline: Array<{
    entity: string;
    start: string;
    end: string;
    start_second: number;
    end_second: number;
    duration_seconds: number;
  }>;
}

export interface VideoListResponse {
  videos: Video[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UploadResponse {
  video_id: string;
  filename: string;
  status: string;
  has_voice_file: boolean;
  interval_seconds: number;
  message: string;
}
