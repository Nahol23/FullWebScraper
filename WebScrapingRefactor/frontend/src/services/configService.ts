import type { ApiConfig } from '../types/ApiConfig';
import apiClient from './apiClient';

export const configService = {
  getAll: async (): Promise<ApiConfig[]> => {
    const { data } = await apiClient.get<ApiConfig[]>('/configs');
    return data;
  },

  getByName: async (name: string): Promise<ApiConfig> => {
    const { data } = await apiClient.get<ApiConfig>(`/configs/${name}`);
    return data;
  },

  save: async (config: Partial<ApiConfig>): Promise<void> => {
    await apiClient.post('/configs', config);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/configs/${id}`);
  },

  // Per aggiornare solo campi specifici (es. selectedFields o pagination)
  patch: async (name: string, updates: Partial<ApiConfig>): Promise<void> => {
    await apiClient.patch(`/configs/${name}`, updates);
  }
};