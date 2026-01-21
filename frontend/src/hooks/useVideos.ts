import { useQuery } from '@tanstack/react-query';
import { videosApi } from '../api/videos';

export const useVideos = (params?: {
  status?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: string;
}) => {
  return useQuery({
    queryKey: ['videos', params],
    queryFn: () => videosApi.getVideos(params),
    refetchInterval: 5000, // Refresh list every 5s to show status updates
  });
};
