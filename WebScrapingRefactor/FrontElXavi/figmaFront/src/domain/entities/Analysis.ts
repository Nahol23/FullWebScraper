export interface Analysis {
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