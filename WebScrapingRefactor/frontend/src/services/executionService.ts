import apiClient from './apiClient';
import type { Execution } from '../types/Execution';
import type { ApiResponseDTO } from '../types/ApiResponseDTO';

export const executionService = {
  // Esegue l'API e ottiene i dati estratti
  execute: async (
    name: string, 
    runtimeParams?: Record<string, unknown>
  ): Promise<ApiResponseDTO> => {
    const { data } = await apiClient.post<ApiResponseDTO>(
      `/executions/${name}/execute`, 
      runtimeParams
    );
    return data;
  },

  // Recupera tutti i log di esecuzione
  getLogs: async (): Promise<Execution[]> => {
    const { data } = await apiClient.get<Execution[]>('/executions');
    return data.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  }
};