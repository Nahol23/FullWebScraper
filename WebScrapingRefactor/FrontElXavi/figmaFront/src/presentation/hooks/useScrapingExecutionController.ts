import { useState, useCallback } from "react";
import type { ScrapingExecution } from "../../domain/entities/ScrapingExecution";
import type { ScrapingAnalysisResponse } from "../../domain/entities/ScrapingAnalysisResult";
import {
  executeScrapingByNameUseCase,
  fetchScrapingLogsUseCase,
  deleteScrapingExecutionUseCase,
  downloadScrapingLogsUseCase,
  analyzeScrapingUseCase,
  analyzeScrapingByIdUseCase,
} from "../../di/scrapingIoc";

export function useScrapingExecutionController() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ScrapingAnalysisResponse | null>(null);
  const [logs, setLogs] = useState<ScrapingExecution[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (configName: string, runtimeParams?: any) => {
    if (!configName) {
      console.error("configName is required for execution");
      return;
    }
    setIsExecuting(true);
    setError(null);
    try {
      const result = await executeScrapingByNameUseCase.execute(configName, runtimeParams);
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
      const result = await analyzeScrapingUseCase.execute({ url, ...options });
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
      const result = await analyzeScrapingByIdUseCase.execute(configId, options);
      setAnalysisResult(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const fetchLogs = useCallback(async (configName: string) => {
    if (!configName) return;
    setIsLoadingLogs(true);
    setError(null);
    try {
      const data = await fetchScrapingLogsUseCase.execute(configName);
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const deleteLog = useCallback(async (configId: string, executionId: string) => {
    try {
      await deleteScrapingExecutionUseCase.execute(configId, executionId);
      setLogs((prev) => prev.filter((log) => log.id !== executionId));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const downloadLogs = useCallback(async (configName: string, format: "json" | "markdown" = "json") => {
    try {
      const blob = await downloadScrapingLogsUseCase.execute(configName, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${configName}.${format === "markdown" ? "md" : "json"}`);
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