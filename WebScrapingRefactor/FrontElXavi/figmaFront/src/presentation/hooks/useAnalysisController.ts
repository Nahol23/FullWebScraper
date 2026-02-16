import { useState, useCallback } from "react";
import { analyzeApiUseCase } from "../../di/ioc";
import type { Analysis } from "../../domain/entities/Analysis";

export function useAnalysisController() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<Analysis | null>(null);

  const analyzeApi = useCallback(async (options: {
    url: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: any;
  }): Promise<Analysis> => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeApiUseCase.execute(options);
      setLastAnalysis(result);
      return result;
    } catch (err: any) {
      const message = err.message || 'Analysis failed';
      setError(message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    isAnalyzing,
    error,
    lastAnalysis,
    analyzeApi,
    clearError: () => setError(null),
  };
}