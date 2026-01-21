import { useMutation, useQueryClient } from '@tanstack/react-query';
import { videosApi } from '../api/videos';

export const useUploadVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => videosApi.uploadVideo(formData),
    onSuccess: () => {
      // Invalidate video list to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};
