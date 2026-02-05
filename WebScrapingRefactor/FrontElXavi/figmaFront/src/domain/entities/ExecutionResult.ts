/**
 * Domain Entity: ExecutionResult
 * Pure TypeScript - No React, No Axios dependencies
 */

export interface ExecutionResult {
  status: number;
  statusText: string;
  duration: number;
  data: any;
}
