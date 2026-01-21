import { useMutation, useQueryClient } from '@tanstack/react-query';
import { videosApi } from '../api/videos';

export const useDeleteVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ videoId, deleteFiles }: { videoId: string; deleteFiles: boolean }) =>
      videosApi.deleteVideo(videoId, deleteFiles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};
