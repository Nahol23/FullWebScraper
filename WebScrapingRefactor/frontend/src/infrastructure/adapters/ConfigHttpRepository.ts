import type { ConfigRepository } from "../../domain/ports/ConfigRepository";
import type { ApiConfig } from "../../types/ApiConfig";
import apiClient from "../http/apiClient";

export class ConfigHttpRepository implements ConfigRepository {
  async getAll(): Promise<ApiConfig[]> {
    const { data } = await apiClient.get("/configs");
    return data;
  }

  async getByName(name: string): Promise<ApiConfig> {
    const { data } = await apiClient.get(`/configs/${name}`);
    return data;
  }

  async save(config: Partial<ApiConfig>): Promise<void> {
    await apiClient.post("/configs", config);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/configs/${id}`);
  }

  async patch(name: string, updates: Partial<ApiConfig>): Promise<void> {
    await apiClient.patch(`/configs/${name}`, updates);
  }
}
