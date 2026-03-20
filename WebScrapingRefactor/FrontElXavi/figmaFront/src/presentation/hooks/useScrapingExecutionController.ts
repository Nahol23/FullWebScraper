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
import { scrapingExecutionRepository } from "../../di/scrapingIoc";

// ── Struttura normalizzata esposta al componente ───────────────────────────────
export interface ScrapingExecutionResult {
  data: unknown[];
  nextPageUrl: string | null;
  meta: {
    pagesScraped?: number;
    totalItems?: number;
  };
}

/**
 * Normalizza qualunque risposta del backend nel formato atteso da ScrapingExecuteTab.
 * Gestisce: { data, nextPageUrl, meta }, array grezzo, oggetto qualsiasi.
 */
function normalizeScrapingResult(response: unknown): ScrapingExecutionResult {
  if (!response || typeof response !== "object") {
    return { data: [], nextPageUrl: null, meta: {} };
  }

  const r = response as Record<string, unknown>;

  // Caso 1: struttura già corretta { data, nextPageUrl, meta }
  if ("data" in r) {
    const data = Array.isArray(r.data)
      ? r.data
      : r.data != null
        ? [r.data]
        : [];
    return {
      data,
      nextPageUrl: (r.nextPageUrl as string | null) ?? null,
      meta: {
        pagesScraped: (r.meta as Record<string, unknown>)?.pagesScraped as
          | number
          | undefined,
        totalItems:
          ((r.meta as Record<string, unknown>)?.totalItems as
            | number
            | undefined) ?? data.length,
      },
    };
  }

  // Caso 2: array grezzo
  if (Array.isArray(response)) {
    return {
      data: response,
      nextPageUrl: null,
      meta: { totalItems: response.length },
    };
  }

  // Caso 3: oggetto qualsiasi — wrappato in array
  return { data: [response], nextPageUrl: null, meta: { totalItems: 1 } };
}

export function useScrapingExecutionController() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ScrapingExecutionResult | null>(
    null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<ScrapingAnalysisResponse | null>(null);
  const [logs, setLogs] = useState<ScrapingExecution[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(false);

  // ── execute ────────────────────────────────────────────────────────────────
  const execute = useCallback(
    async (configName: string, runtimeParams?: Record<string, unknown>) => {
      if (!configName) {
        console.error(
          "[useScrapingExecutionController] configName is required",
        );
        return;
      }

      setIsExecuting(true);
      setLastResult(null); // FIX 1: reset esplicito — forza re-render e pulisce UI tra esecuzioni
      setError(null);

      try {
        const raw = await executeScrapingByNameUseCase.execute(
          configName,
          runtimeParams,
        );
        console.log(
          "[useScrapingExecutionController] raw execute result:",
          raw,
        );

        const normalized = normalizeScrapingResult(raw);
        setLastResult(normalized);
        console.log(
          "[useScrapingExecutionController] lastResult set:",
          normalized,
        );

        return normalized;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setIsExecuting(false);
      }
    },
    [],
  );

  //  resume 
  const resume = useCallback(async (configId: string, maxPages?: number) => {
    setIsResuming(true);
    setError(null);

    try {
      const raw = await scrapingExecutionRepository.resume(configId, maxPages);
      console.log("[RESUME RAW]", JSON.stringify(raw, null, 2)); 

      // FIX 2: usa result.data (non result.result che non esiste)
      const normalized = normalizeScrapingResult(raw);

      // FIX 3: accumula correttamente — i nuovi item si aggiungono ai precedenti
      setLastResult((prev) => {
        const prevData = Array.isArray(prev?.data) ? prev.data : [];
        const newData = normalized.data;
        return {
          ...normalized,
          data: [...prevData, ...newData],
          meta: {
            ...normalized.meta,
            totalItems: prevData.length + newData.length,
          },
        };
      });

      return normalized;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsResuming(false);
    }
  }, []);

  // ── analyze ────────────────────────────────────────────────────────────────
  const analyze = useCallback(
    async (url: string, options?: Record<string, unknown>) => {
      setIsAnalyzing(true);
      setError(null);
      try {
        const result = await analyzeScrapingUseCase.execute({
          url,
          ...options,
        });
        setAnalysisResult(result);
        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  const analyzeById = useCallback(
    async (configId: string, options?: Record<string, unknown>) => {
      setIsAnalyzing(true);
      setError(null);
      try {
        const result = await analyzeScrapingByIdUseCase.execute(
          configId,
          options,
        );
        setAnalysisResult(result);
        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  // ── logs ───────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (configName: string) => {
    if (!configName) return;
    setIsLoadingLogs(true);
    setError(null);
    try {
      const data = await fetchScrapingLogsUseCase.execute(configName);
      setLogs(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const deleteLog = useCallback(
    async (configId: string, executionId: string) => {
      try {
        await deleteScrapingExecutionUseCase.execute(configId, executionId);
        setLogs((prev) => prev.filter((log) => log.id !== executionId));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      }
    },
    [],
  );

  const downloadLogs = useCallback(
    async (configName: string, format: "json" | "markdown" = "json") => {
      try {
        const blob = await downloadScrapingLogsUseCase.execute(
          configName,
          format,
        );
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `${configName}.${format === "markdown" ? "md" : "json"}`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      }
    },
    [],
  );

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
    isResuming,
    resume,
  };
}
