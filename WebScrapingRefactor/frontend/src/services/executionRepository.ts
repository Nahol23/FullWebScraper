import { executionService } from './executionService';
import type { Execution } from '../types/Execution';
import type { ApiResponseDTO } from '../types/ApiResponseDTO';

/**
 *  client-side adapter that exposes repository-style
 * methods backed by HTTP calls implemented in executionService.
 */
export const executionRepository = {
  
  //Invoke execution for a named config on the backend. Returns the
    // raw ApiResponseDTO coming from the execution endpoint (extracted data).
   
  async execute(name: string, runtimeParams?: Record<string, unknown>): Promise<ApiResponseDTO> {
    return executionService.execute(name, runtimeParams);
  },

  
   // List past executions (backend endpoint currently returns executions).
  
  async listAll(): Promise<Execution[]> {
    return executionService.getLogs();
  },

  /**
   * Find a single execution by id. Returns null if not found.
   */
  async findById(id: string): Promise<Execution | null> {
    const all = await this.listAll();
    return all.find((e) => e.id === id) ?? null;
  },

  /**
   * Return all executions related to a specific config id.
   */
  async findByConfigId(configId: string): Promise<Execution[]> {
    const all = await this.listAll();
    return all.filter((e) => e.configId === configId);
  },

  /**
   * Convenience method: maps an ApiResponseDTO into a minimal execution
   * summary record. This is a client-side helper when the backend does
   * not return an execution metadata object after running.
   */
  buildExecutionSummaryFromResponse(configId: string, res: ApiResponseDTO): Execution {
    const id = `${configId}-${Date.now()}`;
    return {
      id,
      configId,
      timestamp: new Date().toISOString(),
      parametersUsed: {},
      resultCount: res?.meta?.total ?? (Array.isArray(res?.data) ? res.data.length : 0),
      status: 'success',
    } as Execution;
  },
};
