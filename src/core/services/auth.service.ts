import { apiClient } from '../api/api-client';
import { setCookie, deleteCookie } from 'cookies-next';
import { LoginRequest, AuthResponse } from '../types/auth.types';

export const AuthService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<never, AuthResponse>('/auth/login', credentials);

    if (response.accessToken) {
      setCookie('admin_token', response.accessToken, { maxAge: 60 * 60 * 24 });
    }

    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post<never, void>('/auth/logout');
    } catch (error) {
      console.warn('Logout backend gagal, tetapi token lokal akan tetap dihapus', error);
    } finally {
      deleteCookie('admin_token');
    }
  }
};