import { db } from "../database/database";
import type {
  ApiConfigRow,
  NewApiConfig,
  ApiConfigUpdate,
} from "../database/types";
import { parseJson, toJson } from "../database/mappers/jsonMapper";
import type { IConfigRepository } from "../../domain/ports/IConfigRepository";
import type {
  ApiConfig,
  PaginationConfig,
} from "../../domain/entities/ApiConfig";
import { ApiParam } from "../../domain/value-objects/ApiParam";

export class ConfigRepository implements IConfigRepository {
  async findAll(): Promise<ApiConfig[]> {
    const rows = await db.selectFrom("api_configs").selectAll().execute();

    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<ApiConfig | null> {
    const rows = await db
      .selectFrom("api_configs")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return rows ? this.toDomain(rows) : null;
  }

  async findByName(name: string): Promise<ApiConfig | null> {
    const row = await db
      .selectFrom("api_configs")
      .selectAll()
      .where("name", "=", name)
      .executeTakeFirst();

    if (!row) return null;
    return this.toDomain(row);
  }

  async save(config: ApiConfig): Promise<void> {
    await db
      .insertInto("api_configs")
      .values(this.toPersistence(config))
      .execute();
  }

  async update(id: string, config: ApiConfig): Promise<void> {
    await db
      .updateTable("api_configs")
      .set(this.toPersistence(config) satisfies ApiConfigUpdate)
      .where("id", "=", id)
      .execute();
  }

  async delete(id: string): Promise<void> {
    await db.deleteFrom("api_configs").where("id", "=", id).execute();
  }

  private toDomain(row: ApiConfigRow): ApiConfig {
    return {
      id: row.id,
      name: row.name,
      baseUrl: row.base_url,
      endpoint: row.endpoint,
      method: row.method as ApiConfig["method"],

      queryParams: parseJson<ApiParam[]>(row.query_params_json),
      headers: parseJson<Record<string, string>>(row.headers),
      body: parseJson<unknown>(row.body_json),
      dataPath: row.data_path ?? undefined,
      pagination: parseJson<PaginationConfig>(row.pagination_json),
      filter: parseJson<{ field: string; value: unknown }>(row.filter_json),
      selectedFields: parseJson<string[]>(row.selected_fields_json),
    };
  }

  private toPersistence(config: ApiConfig): NewApiConfig {
    return {
      id: config.id,
      name: config.name,
      base_url: config.baseUrl,
      endpoint: config.endpoint,
      method: config.method,

      query_params_json: toJson(config.queryParams),
      headers: toJson(config.headers),
      body_json: toJson(config.body),
      data_path: config.dataPath ?? null,
      pagination_json: toJson(config.pagination),
      filter_json: toJson(config.filter),
      selected_fields_json: toJson(config.selectedFields),
    };
  }
}
