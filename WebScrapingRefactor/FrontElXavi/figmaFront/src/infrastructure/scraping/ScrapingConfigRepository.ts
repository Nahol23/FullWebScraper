import type { IScrapingConfigRepository } from "../../domain/ports/scraping/IScrapingConfigRepository";
import type { ScrapingConfig } from "../../domain/entities/ScrapingConfig";
import { HttpClient } from "../http/httpClient";
import { ApiExecutionError } from "@/domain/errors/AppError";

/**
 * Normalizes a raw backend object into a valid ScrapingConfig.
 *
 * The backend may return objects where the primary key is exposed as
 * `_id`, `configId`, or not at all (using `name` as the de-facto key).
 * This function guarantees that `config.id` is always a non-empty string
 * before the object leaves the infrastructure layer.
 */
function normalizeConfig(raw: Record<string, unknown>): ScrapingConfig {
  const id =
    (raw["id"] as string | undefined) ||
    (raw["_id"] as string | undefined) ||
    (raw["configId"] as string | undefined) ||
    (raw["name"] as string | undefined) || // last-resort: name is unique
    "";

  return { ...(raw as unknown as ScrapingConfig), id };
}

export class ScrapingConfigRepository implements IScrapingConfigRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getAll(): Promise<ScrapingConfig[]> {
    const { data } =
      await this.httpClient.get<Record<string, unknown>[]>("/scraping/configs");
    return data.map(normalizeConfig);
  }

  async getById(id: string): Promise<ScrapingConfig | null> {
    try {
      const { data } = await this.httpClient.get<Record<string, unknown>>(
        `/scraping/configs/${id}`,
      );
      return normalizeConfig(data);
    } catch {
      return null;
    }
  }

  async getByName(name: string): Promise<ScrapingConfig | null> {
    const all = await this.getAll();
    return all.find((c) => c.name === name) ?? null;
  }

  async save(config: Omit<ScrapingConfig, "id">): Promise<ScrapingConfig> {
    try {
      const response = await this.httpClient.post<Record<string, unknown>>(
        "/scraping/configs",
        config,
      );
      return normalizeConfig(response.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number } };
      throw new ApiExecutionError(
        err.response?.data?.message ?? "Errore nel salvataggio della configurazione",
        err.response?.status,
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