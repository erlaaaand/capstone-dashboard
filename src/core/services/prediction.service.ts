// src/services/admin-prediction.service.ts
import { apiClient } from '../api/api-client';
import { PaginatedPredictions, Prediction } from '../types/prediction.types';

export interface AdminPredictionListParams {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  isVerified?: boolean;
  varietyCode?: string;
}

export interface VerifyPredictionPayload {
  isVerified: boolean;
  adminNote?: string;
}

export const AdminPredictionService = {
  list: async (params?: AdminPredictionListParams): Promise<PaginatedPredictions> => {
    const response = await apiClient.get<PaginatedPredictions>('/admin/predictions', { 
      params 
    });
    return response.data; 
  },

  verify: async (id: string, payload: VerifyPredictionPayload): Promise<Prediction> => {
    const response = await apiClient.patch<Prediction>(
      `/admin/predictions/${id}/verify`, 
      payload
    );
    return response.data;
  }
};