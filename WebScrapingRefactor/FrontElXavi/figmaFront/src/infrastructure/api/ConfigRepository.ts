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
      const { data } = await this.httpClient.get<ApiConfig>(`/configs/${id}`);
      return data;
    } catch (error) {
      return null;
    }
  }

  async save(config: ApiConfig): Promise<void> {
    await this.httpClient.post('/configs', config);
  }

  async update(id: string, updates: Partial<ApiConfig>): Promise<void> {
    await this.httpClient.put(`/configs/${id}`, updates);
  }

  async delete(id: string): Promise<void> {
    await this.httpClient.delete(`/configs/${id}`);
  }
}