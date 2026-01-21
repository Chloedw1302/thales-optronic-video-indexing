import { apiClient } from './client';
import type {
  VideoListResponse,
  VideoDetail,
  VideoStatusResponse,
  VideoReport,
  UploadResponse
} from '../types/video';

export const videosApi = {
  // Upload video
  uploadVideo: async (formData: FormData): Promise<UploadResponse> => {
    const { data } = await apiClient.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // List videos
  getVideos: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    order?: string;
  }): Promise<VideoListResponse> => {
    const { data } = await apiClient.get('/videos', { params });
    return data;
  },

  // Get video details
  getVideo: async (videoId: string): Promise<VideoDetail> => {
    const { data } = await apiClient.get(`/videos/${videoId}`);
    return data;
  },

  // Get video status (for polling)
  getVideoStatus: async (videoId: string): Promise<VideoStatusResponse> => {
    const { data } = await apiClient.get(`/videos/${videoId}/status`);
    return data;
  },

  // Get video report
  getVideoReport: async (videoId: string): Promise<VideoReport> => {
    const { data } = await apiClient.get(`/videos/${videoId}/report`);
    return data;
  },

  // Delete video
  deleteVideo: async (videoId: string, deleteFiles: boolean = true) => {
    const { data } = await apiClient.delete(`/videos/${videoId}`, {
      params: { delete_files: deleteFiles },
    });
    return data;
  },

  // Download video
  downloadVideo: (videoId: string): string => {
    return `/api/v1/videos/${videoId}/download/video`;
  },

  // Download report
  downloadReport: (videoId: string): string => {
    return `/api/v1/videos/${videoId}/download/report`;
  },

  // Get frame URL
  getFrameUrl: (videoId: string, frameNumber: number): string => {
    return `/api/v1/videos/${videoId}/frames/${frameNumber}`;
  },
};
