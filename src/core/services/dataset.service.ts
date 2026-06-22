import { apiClient } from '../api/api-client';
import { Dataset, PaginatedDatasets } from '../types/dataset.types';

export const DatasetService = {
  list: (page: number = 1, limit: number = 10): Promise<PaginatedDatasets> => {
    return apiClient.get('/admin/datasets', { params: { page, limit } });
  },

  getById: (id: string): Promise<Dataset> => {
    return apiClient.get(`/admin/datasets/${id}`);
  },

  create: (data: { name: string; description?: string; exportFormat: string }): Promise<Dataset> => {
    return apiClient.post('/admin/datasets', data);
  },

  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/admin/datasets/${id}`);
  },

  export: (id: string): Promise<Dataset> => {
    return apiClient.post(`/admin/datasets/${id}/export`);
  },

  bulkAddByConfidence: (
    datasetId: string, 
    data: { confidenceThreshold: number; varietyCode?: string; onlyVerified?: boolean }
  ) => {
    return apiClient.post(`/admin/datasets/${datasetId}/items/bulk`, data);
  },

  removeItem: (datasetId: string, itemId: string): Promise<void> => {
    return apiClient.delete(`/admin/datasets/${datasetId}/items/${itemId}`);
  }
};