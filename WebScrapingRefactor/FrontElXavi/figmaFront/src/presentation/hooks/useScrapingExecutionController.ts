// src/presentation/hooks/useScrapingExecutionController.ts
import { useState, useCallback } from 'react';
import { scrapingApi } from '../../di/scrapingIoc';
import type { ScrapingExecution } from '../../domain/entities/ScrapingExecution';

export interface ContainerSuggestion {
  selector: string;
  count: number;
  sampleData?: Record<string, any>;
  suggestedRules?: any[];
}

export interface ScrapingAnalysisResponse {
  url: string;
  title: string;
  suggestedRules: any[];  
  sampleData: any;         
  detectedListSelectors: string[]; 
  rawPreview?: string;
}

export function useScrapingExecutionController() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ScrapingAnalysisResponse | null>(null);

  const [logs, setLogs] = useState<ScrapingExecution[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

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

 // src/presentation/hooks/useScrapingExecutionController.ts

const analyze = useCallback(async (url: string, options?: any) => {
  setIsAnalyzing(true);
  setError(null);
  try {
    console.log("[useScrapingExecutionController.analyze] Calling with:", { url, options });
    
    const result = await scrapingApi.analyze(url, options);
    
    console.log("[useScrapingExecutionController.analyze] Raw API response:", result);
    console.log("[useScrapingExecutionController.analyze] Response keys:", Object.keys(result || {}));
    
    // Mappa la risposta
    const mappedResult: ScrapingAnalysisResponse = {
      url: result.url,
      title: result.title,
      suggestedRules: result.suggestedRules || [],
      sampleData: result.sampleData,
      detectedListSelectors: result.detectedListSelectors || [],
      rawPreview: result.rawPreview,
    };
    
    console.log("[useScrapingExecutionController.analyze] Mapped result:", mappedResult);
    console.log("[useScrapingExecutionController.analyze] Suggested rules:", mappedResult.suggestedRules);
    console.log("[useScrapingExecutionController.analyze] Sample data:", mappedResult.sampleData);
    
    setAnalysisResult(mappedResult);
    return mappedResult;
  } catch (err: any) {
    console.error("[useScrapingExecutionController.analyze] Error:", err);
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
      const result = (await scrapingApi.analyzeById(
        configId,
        options,
      )) as ScrapingAnalysisResponse;
      setAnalysisResult(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const fetchLogs = useCallback(async (configId: string) => {
    setIsLoadingLogs(true);
    setError(null);
    try {
      const data = await scrapingApi.getExecutionsByConfigId(configId);
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const deleteLog = useCallback(async (configId: string, executionId: string) => {
    try {
      await scrapingApi.deleteExecution(configId, executionId);
      setLogs(prev => prev.filter(log => log.id !== executionId));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const downloadLogs = useCallback(async (configName: string, format: 'json' | 'markdown' = 'json') => {
    try {
      const blob = await scrapingApi.downloadExecutionLogs(configName, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${configName}.${format === 'markdown' ? 'md' : 'json'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  

  return {
    isExecuting,
    lastResult,
    execute,
    isAnalyzing,
    analysisResult,
    analyze,
    analyzeById,
    logs,
    isLoadingLogs,
    fetchLogs,
    deleteLog,
    downloadLogs,
    error,
    clearError,
  };
}