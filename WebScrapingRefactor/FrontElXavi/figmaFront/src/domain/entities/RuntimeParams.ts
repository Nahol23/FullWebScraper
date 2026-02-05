/**
 * Domain Entity: RuntimeParams
 * Pure TypeScript - No React, No Axios dependencies
 */

export interface RuntimeParams {
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
  [key: string]: any;
}
