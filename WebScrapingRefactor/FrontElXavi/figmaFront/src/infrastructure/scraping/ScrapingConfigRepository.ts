import type { IScrapingConfigRepository } from "../../domain/ports/scraping/IScrapingConfigRepository";
import type { ScrapingConfig } from "../../domain/entities/ScrapingConfig";
import { HttpClient } from "../http/httpClient";
import { ApiExecutionError } from "@/domain/errors/AppError";

export class ScrapingConfigRepository implements IScrapingConfigRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getAll(): Promise<ScrapingConfig[]> {
    const { data } =
      await this.httpClient.get<ScrapingConfig[]>("/scraping/configs");
    return data;
  }

  async getById(id: string): Promise<ScrapingConfig | null> {
    try {
      const { data } = await this.httpClient.get<ScrapingConfig>(
        `/scraping/configs/${id}`,
      );
      return data;
    } catch (error) {
      return null;
    }
  }

  async getByName(name: string): Promise<ScrapingConfig | null> {
    const all = await this.getAll();
    return all.find((c) => c.name === name) || null;
  }

  async save(config: Omit<ScrapingConfig, "id">): Promise<ScrapingConfig> {
    try {
      console.log("[ScrapingConfigRepository] sending config:", config);
      const response = await this.httpClient.post<ScrapingConfig>(
        "/scraping/configs",
        config,
      );
      console.log("[ScrapingConfigRepository] response data:", response.data);
      return response.data;
    } catch (error: any) {
      throw new ApiExecutionError(
        error.response?.data?.message ||
          "Errore nel salvataggio della configurazione",
        error.response?.status,
      );
    }
  }

  async update(id: string, updates: Partial<ScrapingConfig>): Promise<void> {
    await this.httpClient.put(`/scraping/configs/${id}`, updates);
  }

  async delete(id: string): Promise<void> {
    await this.httpClient.delete(`/scraping/configs/${id}`);
  }
}
