import { useState, useCallback } from "react";
import type { ScrapingConfig } from "../../domain/entities/ScrapingConfig";
import { scrapingApi } from "@/di/scrapingIoc";

export function useScrapingConfigController() {
  const [configs, setConfigs] = useState<ScrapingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await scrapingApi.getAllConfigs();
      setConfigs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveScrapingConfig = useCallback(
    async (config: Omit<ScrapingConfig, "id">) => {
      console.log(
        "[useScrapingConfigController] ===== SAVE CONFIG CALLED =====",
      );
      console.log("[useScrapingConfigController] Config:", config);
      console.log(
        "[useScrapingConfigController] Stack trace:",
        new Error().stack,
      );
      setIsLoading(true);
      try {
        const saved = await scrapingApi.createConfig(config);
        setConfigs((prev) => [...prev, saved]);
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
        await scrapingApi.updateConfig(id, updates);
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
      await scrapingApi.deleteConfig(id);
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
