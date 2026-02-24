
export interface RuntimeParams {
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
  [key: string]: any;
  headers?: Record<string, string>; 
  body?: any;        
  selectedFields?: string[];
  queryParams?: Record<string, string>; 
}
