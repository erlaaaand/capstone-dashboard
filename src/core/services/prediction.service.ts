import { apiClient } from '../api/api-client';
import { PaginatedPredictions, Prediction } from '../types/prediction.types';

export const AdminPredictionService = {
  list: (params: { page?: number; limit?: number; status?: string; isVerified?: boolean; varietyCode?: string }): Promise<PaginatedPredictions> => {
    return apiClient.get('/admin/predictions', { params });
  },

  verify: (id: string, data: { isVerified: boolean; adminNote?: string }): Promise<Prediction> => {
    return apiClient.patch(`/admin/predictions/${id}/verify`, data);
  }
};