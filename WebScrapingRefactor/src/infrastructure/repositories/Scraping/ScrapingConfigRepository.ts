import { db } from "../../database/database";
import type {
  ScrapingConfigRow,
  NewScrapingConfig,
} from "../../database/types";
import { IScrapingConfigRepository } from "../../../domain/ports/ScrapingConfig/IScrapingConfigRepository";
import { ScrapingConfig } from "../../../domain/entities/ScrapingConfig";
import { parseJson, toJson } from "../../database/mappers/jsonMapper";
import { randomUUID } from "crypto";

export class ScrapingConfigRepository implements IScrapingConfigRepository {
  async getAll(): Promise<ScrapingConfig[]> {
    const rows = await db.selectFrom("scraping_configs").selectAll().execute();
    return rows.map((row: ScrapingConfigRow) => this.toDomain(row));
  }

  async getById(id: string): Promise<ScrapingConfig | null> {
    const row = await db
      .selectFrom("scraping_configs")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? this.toDomain(row) : null;
  }

  async getByName(name: string): Promise<ScrapingConfig | null> {
    const row = await db
      .selectFrom("scraping_configs")
      .selectAll()
      .where("name", "=", name)
      .executeTakeFirst();
    return row ? this.toDomain(row) : null;
  }

  async save(config: ScrapingConfig): Promise<ScrapingConfig> {
    const id = config.id || randomUUID();
    const toInsert = this.toPersistence({ ...config, id });
    await db
      .insertInto("scraping_configs")
      .values(toInsert)
      .onConflict((oc) => oc.column("id").doUpdateSet(toInsert))
      .execute();
    return { ...config, id };
  }

  async update(id: string, updates: Partial<ScrapingConfig>): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Config not found");
    const merged = { ...existing, ...updates };
    await this.save(merged);
  }

  async delete(id: string): Promise<void> {
    await db.deleteFrom("scraping_configs").where("id", "=", id).execute();
  }

  private toDomain(row: ScrapingConfigRow): ScrapingConfig {
    return {
      id: row.id,
      name: row.name,
      url: row.base_url,
      method: (row.method as "GET" | "POST") ?? undefined,
      headers: parseJson<Record<string, string>>(row.headers_json),
      body: parseJson<unknown>(row.body_json),
      rules: parseJson<any[]>(row.rules_json) ?? [],
      pagination: parseJson<any>(row.pagination_json),
      defaultRuntimeParams: parseJson<Record<string, any>>(
        row.default_runtime_params_json,
      ),
      waitForSelector: row.wait_for_selector ?? undefined,
      containerSelector: row.container_selector ?? undefined,
      dataPath: row.data_path ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }

  private toPersistence(config: ScrapingConfig): NewScrapingConfig {
    return {
      id: config.id,
      name: config.name,
      base_url: config.url,
      method: config.method ?? null,
      headers_json: toJson(config.headers),
      body_json: toJson(config.body),
      rules_json: toJson(config.rules) ?? "[]",
      pagination_json: toJson(config.pagination),
      default_runtime_params_json: toJson(config.defaultRuntimeParams),
      wait_for_selector: config.waitForSelector ?? null,
      container_selector: config.containerSelector ?? null,
      data_path: config.dataPath ?? null,
    };
  }
}
