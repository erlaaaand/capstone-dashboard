// src/core/services/prediction.service.ts
import { apiClient } from '../api/api-client';
import { PaginatedPredictions, Prediction } from '../types/prediction.types';

export interface AdminPredictionListParams {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  isVerified?: boolean;
  varietyCode?: string;
  isCurated: boolean;
}

export interface VerifyPredictionPayload {
  isVerified: boolean;
  adminNote?: string;
  correctedVarietyCode?: string;
}

export const AdminPredictionService = {
  list: async (params?: AdminPredictionListParams): Promise<PaginatedPredictions> => {
    return apiClient.get<PaginatedPredictions>('/admin/predictions', { params }) as unknown as PaginatedPredictions;
  },

  verify: async (id: string, payload: VerifyPredictionPayload): Promise<Prediction> => {
    return apiClient.patch<Prediction>(`/admin/predictions/${id}/verify`, payload) as unknown as Prediction;
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/admin/predictions/${id}`);
  },

  exportDataset: async (): Promise<Blob> => {
    const response = await apiClient.get('/admin/predictions/export', {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }
};