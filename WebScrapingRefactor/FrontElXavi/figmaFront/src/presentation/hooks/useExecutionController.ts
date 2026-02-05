/**
 * Presentation Layer: useExecutionController Hook
 * Controller hook for API execution - THE CONTROLLER PATTERN
 * React-only, delegates to Use Cases
 */

import { useState } from "react";
import { executeApiUseCase } from "../../di/ioc";
import type { ExecutionResult } from "../../domain/entities/ExecutionResult";
import type { RuntimeParams } from "../../domain/entities/RuntimeParams";
import type { ApiConfig } from "../../domain/entities/ApiConfig";
import { ApiExecutionError } from "../../domain/errors/AppError";

export function useExecutionController() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [updatedConfig, setUpdatedConfig] = useState<ApiConfig | null>(null);

  const runExecution = async (
    configId: string,
    runtimeParams?: RuntimeParams
  ): Promise<void> => {
    setIsExecuting(true);
    setError(null);
    setResult(null);
    setUpdatedConfig(null);

    try {
      const { result: executionResult, updatedConfig: config } =
        await executeApiUseCase.execute(configId, runtimeParams);

      setResult(executionResult);
      setUpdatedConfig(config);
    } catch (err) {
      if (err instanceof ApiExecutionError) {
        setError(
          `API Error: ${err.message}${err.statusCode ? ` (${err.statusCode})` : ""}`
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const reset = () => {
    setError(null);
    setResult(null);
    setUpdatedConfig(null);
    setIsExecuting(false);
  };

  return {
    runExecution,
    isExecuting,
    error,
    result,
    updatedConfig,
    reset,
  };
}
