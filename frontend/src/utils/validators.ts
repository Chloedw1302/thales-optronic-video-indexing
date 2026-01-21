const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/x-matroska',
  'video/avi',
  'video/quicktime',
  'video/x-msvideo',
];

const MAX_VIDEO_SIZE = 2000 * 1024 * 1024; // 2GB
const MAX_VOICE_SIZE = 10 * 1024 * 1024; // 10MB

export const validateVideoFile = (file: File): string | null => {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mkv|avi|mov)$/i)) {
    return 'Invalid video format. Allowed: MP4, MKV, AVI, MOV';
  }
  if (file.size > MAX_VIDEO_SIZE) {
    return 'Video file too large. Maximum: 2GB';
  }
  return null;
};

export const validateVoiceFile = (file: File): string | null => {
  if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
    return 'Voice file must be a text file (.txt)';
  }
  if (file.size > MAX_VOICE_SIZE) {
    return 'Voice file too large. Maximum: 10MB';
  }
  return null;
};
