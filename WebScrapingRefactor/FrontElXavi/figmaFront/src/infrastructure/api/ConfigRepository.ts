import { HttpClient } from "../http/httpClient";
import type { ApiConfig } from "../../domain/entities/ApiConfig";
import { IConfigRepository } from "../../domain/ports/IConfigRepository";

export class ConfigRepository implements IConfigRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getAll(): Promise<ApiConfig[]> {
    const { data } = await this.httpClient.get<ApiConfig[]>('/configs');
    return data;
  }

  async getById(id: string): Promise<ApiConfig | null> {
    try {
      const { data } = await this.httpClient.get<ApiConfig>(`/configs/id/${id}`);
      return data;
    } catch (error) {
      return null;
    }
  }

 async save(config: ApiConfig): Promise<ApiConfig> {
  const cleanConfig = {
    ...config,
    ...(config.queryParams && config.queryParams.length === 0 && { queryParams: undefined }),
    ...(config.selectedFields && config.selectedFields.length === 0 && { selectedFields: undefined }),
  };
  
  console.log("[Repository] Invio configurazione pulita:", cleanConfig);
  const { data } = await this.httpClient.post<ApiConfig>('/configs', cleanConfig);
  return data;
}

  async update(id: string, updates: Partial<ApiConfig>): Promise<void> {
    await this.httpClient.put(`/configs/${id}`, updates);
  }

  async delete(id: string): Promise<void> {
    await this.httpClient.delete(`/configs/${id}`);
  }
}