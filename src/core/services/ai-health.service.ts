import { apiClient } from '../api/api-client';

export interface AiStatusSnapshot {
  status: 'ONLINE' | 'OFFLINE';
  checkedAt: string;
  message: string;
  modelLoaded: boolean;
  uptimeSeconds: number | null;
}

export const AiHealthService = {
  getCurrentStatus: (): Promise<AiStatusSnapshot> => {
    return apiClient.get('/ai/status/current');
  }
};