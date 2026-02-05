import { useState } from "react";
import { StartExecutionUseCase } from "../application/usecases/StartExecutionUseCase";
import { ExecutionHttpRepository } from "../infrastructure/adapters/ExecutionHttpRepository";
import type { ApiResponseDTO } from "../types/ApiResponseDTO";

const repo = new ExecutionHttpRepository();
const startExecutionUC = new StartExecutionUseCase(repo);

export const useExecution = () => {
  const [isExecuting, setIsExecuting] = useState(false);
const [batchResult, setBatchResult] = useState<ApiResponseDTO | null>(null);
const [error, setError] = useState<string | null>(null);

  const startExecution = async ( configName: string, overrides?: Record<string, unknown> ) => {
    setIsExecuting(true);
    setError(null);

    try {
      const result = await startExecutionUC.execute(configName, overrides);
      setBatchResult(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    startExecution,
    isExecuting,
    batchResult,
    error,
    reset: () => {
      setBatchResult(null);
      setError(null);
    }
  };
};
