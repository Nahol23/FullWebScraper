// src/presentation/hooks/useScrapingConfigController.ts
import { useState, useCallback } from "react";
import type { ScrapingConfig } from "../../domain/entities/ScrapingConfig";
import {
  getScrapingConfigsUseCase,
  saveScrapingConfigUseCase,
  updateScrapingConfigUseCase,
  deleteScrapingConfigUseCase,
} from "../../di/scrapingIoc";

export function useScrapingConfigController() {
  const [configs, setConfigs] = useState<ScrapingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getScrapingConfigsUseCase.execute();
      const uniqueConfigs = Array.from(
        new Map(data.map((c) => [c.id, c])).values(),
      );
      setConfigs(uniqueConfigs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveScrapingConfig = useCallback(
    async (config: Omit<ScrapingConfig, "id">) => {
      setIsLoading(true);
      try {
        const saved = await saveScrapingConfigUseCase.execute(config);
        setConfigs((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          map.set(saved.id, saved);
          return Array.from(map.values());
        });
        return saved;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );
  const updateConfig = useCallback(
    async (id: string, updates: Partial<ScrapingConfig>) => {
      setIsLoading(true);
      try {
        await updateScrapingConfigUseCase.execute(id, updates);
        setConfigs((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        );
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deleteConfig = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await deleteScrapingConfigUseCase.execute(id);
      setConfigs((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    configs,
    isLoading,
    error,
    fetchConfigs,
    saveScrapingConfig,
    updateConfig,
    deleteConfig,
  };
}
