import apiClient from './apiClient';
import type { Analysis } from '../types/Analysis';

export const analyzeService = {
  // Avvia l'analisi "Smart" di un URL
  createAnalysis: async (payload: {
    url: string;
    method: 'GET' | 'POST';
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<Analysis> => {
    const { data } = await apiClient.post<Analysis>('/analyze', payload);
    return data;
  },

  // Recupera lo storico delle analisi
  getHistory: async (): Promise<Analysis[]> => {
    const { data } = await apiClient.get<Analysis[]>('/analyses');
    return data;
  }
};