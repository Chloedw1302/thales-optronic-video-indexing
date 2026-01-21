import type { VideoStatus } from '../types/video';

export const STATUS_COLORS: Record<VideoStatus, string> = {
  uploaded: 'bg-blue-500',
  processing: 'bg-yellow-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

export const STATUS_LABELS: Record<VideoStatus, string> = {
  uploaded: 'Uploaded',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

export const DEFAULT_PAGE_SIZE = 10;
export const MIN_INTERVAL_SECONDS = 1;
export const MAX_INTERVAL_SECONDS = 60;
export const DEFAULT_INTERVAL_SECONDS = 5;

// Search constants
export const MIN_SEARCH_QUERY_LENGTH = 5;
