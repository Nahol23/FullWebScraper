import { scrapingApi } from '@/di/scrapingIoc';
import { useState, useCallback } from 'react';

export function useScrapingExecutionController() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (configId: string, runtimeParams?: any) => {
    setIsExecuting(true);
    setError(null);
    try {
      const result = await scrapingApi.execute(configId, runtimeParams);
      setLastResult(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const analyze = useCallback(async (url: string, options?: any) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await scrapingApi.analyze(url, options);
      setAnalysisResult(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const analyzeById = useCallback(async (configId: string, options?: any) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await scrapingApi.analyzeById(configId, options);
      setAnalysisResult(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    isExecuting,
    isAnalyzing,
    lastResult,
    analysisResult,
    error,
    execute,
    analyze,
    analyzeById,
    clearError: () => setError(null),
  };
}