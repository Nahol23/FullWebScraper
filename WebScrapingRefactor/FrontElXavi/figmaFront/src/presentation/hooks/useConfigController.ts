/**
 * Presentation Layer: useConfigController Hook
 * Controller hook for configuration management - THE CONTROLLER PATTERN
 * React-only, delegates to Use Cases
 */

import { useState, useEffect, useCallback } from "react";
import {
  getConfigsUseCase,
  saveConfigUseCase,
  updateConfigUseCase,
  deleteConfigUseCase,
} from "../../di/ioc";
import type { ApiConfig } from "../../domain/entities/ApiConfig";
import { ValidationError, ConfigNotFoundError } from "../../domain/errors/AppError";

export function useConfigController() {
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all configs
  const loadConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedConfigs = await getConfigsUseCase.execute();
      setConfigs(loadedConfigs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load configurations"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load configs on mount
  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // Get config by ID
  const getConfigById = useCallback(
    async (id: string): Promise<ApiConfig | null> => {
      try {
        return await getConfigsUseCase.executeById(id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load configuration"
        );
        return null;
      }
    },
    []
  );

  // Save new config
  const saveConfig = useCallback(
    async (config: Omit<ApiConfig, "id">): Promise<ApiConfig> => {
      setError(null);
      try {
        const newConfig = await saveConfigUseCase.execute(config);
        setConfigs((prev) => [...prev, newConfig]);
        return newConfig;
      } catch (err) {
        if (err instanceof ValidationError) {
          throw err; // Re-throw validation errors so UI can handle them
        }
        const message =
          err instanceof Error ? err.message : "Failed to save configuration";
        setError(message);
        throw new Error(message);
      }
    },
    []
  );

  // Update existing config
  const updateConfig = useCallback(
    async (config: ApiConfig): Promise<ApiConfig> => {
      setError(null);
      try {
        const updated = await updateConfigUseCase.execute(config);
        setConfigs((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        return updated;
      } catch (err) {
        if (err instanceof ValidationError || err instanceof ConfigNotFoundError) {
          throw err; // Re-throw so UI can handle them
        }
        const message =
          err instanceof Error ? err.message : "Failed to update configuration";
        setError(message);
        throw new Error(message);
      }
    },
    []
  );

  // Delete config
  const deleteConfig = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        await deleteConfigUseCase.execute(id);
        setConfigs((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        if (err instanceof ConfigNotFoundError) {
          throw err; // Re-throw so UI can handle them
        }
        const message =
          err instanceof Error ? err.message : "Failed to delete configuration";
        setError(message);
        throw new Error(message);
      }
    },
    []
  );

  const downloadExecutionReport = useCallback((config: ApiConfig, executionId: string) => {
    const execution = config.executionHistory.find((e) => e.id === executionId);
    if (!execution) return;

    const report = {
      configName: config.name,
      executionId: execution.id,
      timestamp: execution.timestamp,
      status: execution.status,
      recordsExtracted: execution.recordsExtracted,
      errorMessage: execution.errorMessage,
      endpoint: `${config.baseUrl}${config.endpoint}`,
      method: config.method,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `execution-report-${executionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    configs,
    loading,
    error,
    loadConfigs,
    getConfigById,
    saveConfig,
    updateConfig,
    deleteConfig,
    downloadExecutionReport,
  };
}
