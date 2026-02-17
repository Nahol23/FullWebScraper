export interface Analysis {
  data: boolean;
  fields: boolean;
  suggestedFields: unknown;
  dataPath: any;
  id: string;
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  discoveredSchema: {
    suggestedFields: string[];
    dataPath: string;
  };
  createdAt: Date;
  status: 'completed' | 'failed';
}