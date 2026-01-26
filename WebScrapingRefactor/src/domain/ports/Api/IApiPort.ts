export interface IApiPort {
  request<T>(options: {
    url: string;
    method: 'GET' | 'POST';
    body?: any;
    headers?: Record<string, string>;
    params?: Record<string, any>; // to support pagination / query strings
  }): Promise<T>;
}
