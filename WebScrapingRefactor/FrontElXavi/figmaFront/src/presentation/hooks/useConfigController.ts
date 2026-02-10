
import { useState, useCallback } from "react";
import { 
  getConfigsUseCase, 
  saveConfigUseCase, 
  updateConfigUseCase, 
  deleteConfigUseCase 
} from "../../di/ioc";
import type { ApiConfig } from "../../domain/entities/ApiConfig";

export function useConfigController() {
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getConfigsUseCase.execute();
      setConfigs(data);
    } catch (err: any) {
      setError("Impossibile caricare le configurazioni.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  const saveConfig = async (config: ApiConfig) => {
    setIsLoading(true);
    try {
      await saveConfigUseCase.execute(config);
      // Dopo il salvataggio, ricarichiamo la lista per avere i dati aggiornati (e l'ID generato dal backend)
      await fetchConfigs();
    } catch (err: any) {
      setError("Errore durante il salvataggio della configurazione.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  
  const updateConfig = async (config: ApiConfig) => {
    setIsLoading(true);
    try {
      // Usiamo l'ID per identificare cosa aggiornare nel backend
      await updateConfigUseCase.execute(config);
      
      // Aggiornamento ottimistico dello stato locale
      setConfigs((prev) =>
        prev.map((c) => (c.id === config.id ? { ...c, ...config } : c))
      );
    } catch (err: any) {
      setError("Errore durante l'aggiornamento.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConfig = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteConfigUseCase.execute(id);
      // Rimuoviamo dalla lista locale
      setConfigs((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError("Errore durante l'eliminazione.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    configs,
    isLoading, 
    error,
    fetchConfigs,
    saveConfig,
    updateConfig,
    deleteConfig,
  };
}