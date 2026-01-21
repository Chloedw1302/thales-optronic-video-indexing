import { useQuery } from '@tanstack/react-query';
import { videosApi } from '../api/videos';

export const useVideoDetails = (videoId: string | undefined) => {
  return useQuery({
    queryKey: ['video', videoId],
    queryFn: () => videosApi.getVideo(videoId!),
    enabled: !!videoId,
  });
};
