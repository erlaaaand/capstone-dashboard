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
    try {
      const response = await apiClient.get('/admin/predictions/export', {
        responseType: 'blob',
      });

      return response.data as Blob;

    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {

        const errObj = error as { response?: { data?: unknown } };
        const errorData = errObj.response?.data;

        if (errorData instanceof Blob && errorData.type === 'application/json') {
          const errorText = await errorData.text();
          const errorJson = JSON.parse(errorText) as { message?: string };
          throw new Error(errorJson.message || 'Gagal mengunduh dataset');
        }
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Terjadi kesalahan yang tidak diketahui saat mengekspor dataset');
    }
  }
};