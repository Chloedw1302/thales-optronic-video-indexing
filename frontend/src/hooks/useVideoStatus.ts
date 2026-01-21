import { useQuery } from '@tanstack/react-query';
import { videosApi } from '../api/videos';

export const useVideoStatus = (videoId: string | undefined, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['videoStatus', videoId],
    queryFn: () => videosApi.getVideoStatus(videoId!),
    enabled: enabled && !!videoId,
    refetchInterval: (query) => {
      // Stop polling when completed or failed
      if (query.state.data?.status === 'completed' || query.state.data?.status === 'failed') {
        return false;
      }
      return 1500; // Poll every 1.5 seconds during processing
    },
  });
};
