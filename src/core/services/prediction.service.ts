// src/core/services/prediction.service.ts
import axios, { AxiosResponse } from 'axios';
import { apiClient } from '../api/api-client';
import { PaginatedPredictions, Prediction } from '../types/prediction.types';

export interface AdminPredictionListParams {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  isVerified?: boolean;
  varietyCode?: string;
  isCurated?: boolean; // optional: chart tidak perlu filter ini
}

export interface VerifyPredictionPayload {
  isVerified: boolean;
  adminNote?: string;
  correctedVarietyCode?: string;
}

/** Ekstrak Content-Type dari response headers secara type-safe.
 *  AxiosResponseHeaders bisa berupa berbagai bentuk — normalisasi ke string kosong
 *  jika tidak ditemukan atau bukan string.
 */
function getContentType(headers: AxiosResponse['headers']): string {
  const raw = headers['content-type'] ?? headers['Content-Type'];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw[0] ?? '';
  return '';
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
      // responseType 'blob' membuat interceptor (api-client.ts) mengembalikan
      // AxiosResponse penuh — bukan unwrap .data seperti JSON biasa.
      const response = await apiClient.get('/admin/predictions/export', {
        responseType: 'blob',
      }) as unknown as AxiosResponse<Blob>;

      const blob = response.data;

      if (!blob || blob.size === 0) {
        throw new Error('Dataset kosong atau tidak ada data yang bisa diekspor');
      }

      // Cek apakah server return JSON error dengan status 2xx (body bertipe blob)
      const contentType = getContentType(response.headers);
      if (contentType.includes('application/json')) {
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
        // blob.type adalah string biasa — aman pakai .includes()
        if (errorBlob.type.includes('application/json')) {
          try {
            const errorText = await errorBlob.text();
            const errorJson = JSON.parse(errorText) as { message?: string };
            throw new Error(errorJson.message || 'Gagal mengunduh dataset');
          } catch (parseErr) {
            if (parseErr instanceof Error) throw parseErr;
          }
        }
      }

      if (error instanceof Error) throw error;
      throw new Error('Terjadi kesalahan yang tidak diketahui saat mengekspor dataset');
    }
  }
};