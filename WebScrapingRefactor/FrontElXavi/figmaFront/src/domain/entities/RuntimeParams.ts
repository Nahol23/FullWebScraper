/**
 * Domain Entity: RuntimeParams
 * Pure TypeScript - No React, No Axios dependencies
 */

export interface RuntimeParams {
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
  [key: string]: any;
  dataPath?: string;     
  headers?: Record<string, string>; 
  body?: any;        
  selectedFields?: string[];
  queryParams?: Record<string, string>; 
  pagination?: {
    offset?: number;
    limit?: number;
  };
}
