export interface IApiPort {
  request<T>(options: {
    url: string;
    method: 'GET' | 'POST';
    body?: any;
    headers?: Record<string, string>;
  }): Promise<T>;
}
