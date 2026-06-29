// src/core/services/prediction.service.ts
import axios, { AxiosHeaders, AxiosResponse } from 'axios';
import { apiClient } from '../api/api-client';
import { PaginatedPredictions, Prediction } from '../types/prediction.types';

export interface AdminPredictionListParams {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  isVerified?: boolean;
  varietyCode?: string;
  isCurated?: boolean; // Fix: optional — chart fetch semua prediksi tanpa filter ini
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
    return apiClient.delete(`/admin/predictions/${id}`) as unknown as void;
  },

  exportDataset: async (): Promise<Blob> => {
    try {
      // responseType 'blob' membuat interceptor mengembalikan AxiosResponse penuh
      const response = await apiClient.get('/admin/predictions/export', {
        responseType: 'blob',
      }) as unknown as AxiosResponse<Blob>;

      const blob = response.data;

      if (!blob || blob.size === 0) {
        throw new Error('Dataset kosong atau tidak ada data yang bisa diekspor');
      }

      // Fix TS2339: gunakan AxiosHeaders.from() agar .get() type-safe,
      // lalu narrow ke string sebelum .includes()
      const headers = AxiosHeaders.from(response.headers);
      const contentTypeRaw = headers.get('content-type');
      const contentType = typeof contentTypeRaw === 'string' ? contentTypeRaw : '';

      if (contentType.includes('application/json')) {
        // Server return JSON error dengan status 2xx — ekstrak pesannya
        const errorText = await blob.text();
        try {
          const errorJson = JSON.parse(errorText) as { message?: string };
          throw new Error(errorJson.message || 'Server mengembalikan error saat export');
        } catch {
          throw new Error('Gagal mengekspor dataset — respons tidak terduga dari server');
        }
      }

      return blob;

    } catch (error: unknown) {
      // Tangani HTTP error (4xx/5xx) yang body-nya Blob berisi JSON
      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        const errorBlob = error.response.data as Blob;
        if (errorBlob.type.includes('application/json')) {
          const errorText = await errorBlob.text();
          try {
            const errorJson = JSON.parse(errorText) as { message?: string };
            throw new Error(errorJson.message || 'Gagal mengunduh dataset');
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Gagal mengunduh dataset') {
              throw parseErr;
            }
          }
        }
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Terjadi kesalahan yang tidak diketahui saat mengekspor dataset');
    }
  }
};