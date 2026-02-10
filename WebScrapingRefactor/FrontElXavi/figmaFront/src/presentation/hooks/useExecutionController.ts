import { useState, useCallback } from "react";
import { 
  executeApiUseCase, 
  fetchLogsUseCase, 
  deleteExecutionUseCase,
  // Assicurati di aver aggiunto e istanziato questo nel tuo ioc.ts
  downloadLogsUseCase 
} from "../../di/ioc";
import type { ExecutionHistory } from "../../domain/entities/ApiConfig";
import type { RuntimeParams } from "../../domain/entities/RuntimeParams";

export function useExecutionController() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<ExecutionHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  
  const refreshLogs = useCallback(async (configId: string) => {
    setIsLoadingLogs(true);
    setError(null);
    try {
      const history = await fetchLogsUseCase.execute(configId);
      setLogs(history);
    } catch (err: any) {
      setError("Errore nel caricamento della cronologia.");
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  
  const runExecution = async (configId: string, runtimeParams?: RuntimeParams) => {
    setIsExecuting(true);
    setError(null);
    try {
      await executeApiUseCase.execute(configId, runtimeParams);
      // Dopo il successo, aggiorna automaticamente i log
      await refreshLogs(configId);
    } catch (err: any) {
      setError(err.message || "Errore durante l'esecuzione");
    } finally {
      setIsExecuting(false);
    }
  };

 
  const removeLog = async (configId: string, executionId: string) => {
    try {
      await deleteExecutionUseCase.execute(configId, executionId);
      setLogs((prev) => prev.filter((log) => log.id !== executionId));
    } catch (err: any) {
      setError("Errore durante la cancellazione del log");
    }
  };

 
  const downloadLogs = async (configName: string, format: 'json' | 'markdown' = 'json') => {
    try {
      // Il backend restituisce uno stream di file
      const blob = await downloadLogsUseCase.execute(configName, format);
      
      // Logica standard per far scaricare il file dal browser
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${configName}.${format === 'markdown' ? 'md' : 'json'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError("Errore durante il download del file");
    }
  };

  return {
    // Stati
    logs,
    isExecuting,
    isLoadingLogs,
    error,
    // Azioni
    runExecution,
    refreshLogs,
    removeLog,
    downloadLogs,
    // Utility
    clearError: () => setError(null)
  };
}