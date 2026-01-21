import { useQuery } from '@tanstack/react-query';
import { videosApi } from '../api/videos';

export const useVideoReport = (videoId: string | undefined, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['videoReport', videoId],
    queryFn: () => videosApi.getVideoReport(videoId!),
    enabled: enabled && !!videoId,
  });
};
