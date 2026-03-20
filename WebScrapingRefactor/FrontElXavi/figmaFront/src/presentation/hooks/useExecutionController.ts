import { useState, useCallback } from "react";
import {
  executeApiUseCase,
  fetchLogsUseCase,
  deleteExecutionUseCase,
  downloadLogsUseCase,
  apiExecutionRepository,
} from "../../di/ioc";
import type { ExecutionHistory } from "../../domain/entities/ApiConfig";
import type { RuntimeParams } from "../../domain/entities/RuntimeParams";

// ── Normalizzazione risposta ───────────────────────────────────────────────────
// Il backend può rispondere con strutture diverse. Questa funzione le normalizza
// sempre in { data, nextPageUrl, meta } per il frontend.
function normalizeExecutionResult(response: unknown): Record<string, unknown> {
  if (!response || typeof response !== "object") {
    return { data: [], nextPageUrl: null, meta: {} };
  }

  const r = response as Record<string, unknown>;

  // Caso 1: risposta già strutturata { data, meta, nextPageUrl }
  if ("data" in r && "meta" in r) {
    return {
      data: Array.isArray(r.data) ? r.data : [r.data],
      nextPageUrl: r.nextPageUrl ?? null,
      meta: r.meta ?? {},
    };
  }

  // Caso 2: risposta ExecutionResult { status, statusText, data, ... }
  if ("status" in r && "data" in r) {
    const data = Array.isArray(r.data) ? r.data : [r.data];
    return {
      data,
      nextPageUrl: r.nextPageUrl ?? null,
      meta: {
        totalItems: data.length,
        pagesScraped: r.pagesScraped ?? 1,
      },
    };
  }

  // Caso 3: array grezzo
  if (Array.isArray(response)) {
    return {
      data: response,
      nextPageUrl: null,
      meta: { totalItems: response.length },
    };
  }

  // Caso 4: oggetto qualsiasi
  return { data: [response], nextPageUrl: null, meta: {} };
}

export function useExecutionController() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<ExecutionHistory[]>([]);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const refreshLogs = useCallback(async (configId: string) => {
    setIsLoadingLogs(true);
    setError(null);
    try {
      const history = await fetchLogsUseCase.execute(configId);
      setLogs(history);
    } catch {
      setError("Errore nel caricamento della cronologia.");
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const runExecution = async (
    configId: string,
    runtimeParams?: RuntimeParams,
  ) => {
    setIsExecuting(true);
    setLastResult(null); // reset esplicito — forza re-render anche se i dati sembrano uguali
    setError(null);
    try {
      const validId =
        typeof configId === "object"
          ? ((configId as Record<string, unknown>).id as string)
          : configId;

      const response = await executeApiUseCase.execute(
        validId,
        runtimeParams ?? {},
      );
      console.log(
        "[useExecutionController] RAW response:",
        JSON.stringify(response, null, 2),
      );

      // Normalizza sempre in { data, nextPageUrl, meta }
      const normalized = normalizeExecutionResult(response);
      setLastResult(normalized);
      console.log("[useExecutionController] lastResult set:", normalized);

      await refreshLogs(validId);
    } catch (err: unknown) {
      console.error("[useExecutionController] Error:", err);
      setError((err as Error).message);
    } finally {
      setIsExecuting(false);
    }
  };

  const resumeExecution = async (configId: string, maxPages?: number) => {
    setIsResuming(true);
    setError(null);
    try {
      console.log(
        "[resumeExecution] calling resume with configId:",
        configId,
        "maxPages:",
        maxPages,
      );
      const result = await apiExecutionRepository.resume(configId, maxPages);
      console.log(
        "[resumeExecution] RAW result:",
        JSON.stringify(result, null, 2),
      );
      // Accumula i nuovi item ai precedenti
      setLastResult((prev) => {
        const prevData = Array.isArray(prev?.data)
          ? (prev.data as unknown[])
          : [];
        const normalized = normalizeExecutionResult(result);
        const newData = Array.isArray(normalized.data)
          ? (normalized.data as unknown[])
          : [];
        return {
          ...normalized,
          data: [...prevData, ...newData],
          meta: {
            ...((normalized.meta as Record<string, unknown>) ?? {}),
            totalItems: prevData.length + newData.length,
          },
        };
      });

      await refreshLogs(configId);
      return result;
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsResuming(false);
    }
  };

  const removeLog = async (configId: string, executionId: string) => {
    try {
      await deleteExecutionUseCase.execute(configId, executionId);
      setLogs((prev) => prev.filter((log) => log.id !== executionId));
    } catch {
      setError("Errore durante la cancellazione del log");
    }
  };

  const downloadLogs = async (
    configName: string,
    format: "json" | "markdown" = "json",
  ) => {
    try {
      const blob = await downloadLogsUseCase.execute(configName, format);
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
    } catch {
      setError("Errore durante il download del file");
    }
  };

  return {
    // Stati
    logs,
    isExecuting,
    isResuming,
    isLoadingLogs,
    lastResult,
    error,
    // Azioni
    runExecution,
    resumeExecution,
    refreshLogs,
    removeLog,
    downloadLogs,
    clearError: () => setError(null),
  };
}
