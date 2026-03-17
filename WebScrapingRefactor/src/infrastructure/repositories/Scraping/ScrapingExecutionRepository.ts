import { db } from "../../database/database";
import { IScrapingExecutionRepository } from "../../../domain/ports/ScrapingConfig/IScrapingExecutionRepository";
import { ScrapingExecution } from "../../../domain/entities/ScrapingExecution";
import { parseJson, toJson } from "../../database/mappers/jsonMapper";
import { randomUUID } from "crypto";

export class ScrapingExecutionRepository implements IScrapingExecutionRepository {
  async save(execution: ScrapingExecution): Promise<void> {
    const id = execution.id || randomUUID();
    const toInsert = {
      id,
      config_id: execution.configId,
      url: execution.url,
      rules_used_json: toJson(execution.rulesUsed) ?? "[]",
      result_json: toJson(execution.result) ?? "{}",
      result_count: execution.resultCount,
      status: execution.status,
      error_message: execution.errorMessage ?? null,
      duration: execution.duration ?? null,
    };
    await db
      .insertInto("scraping_executions")
      .values(toInsert)
      .onConflict((oc) => oc.column("id").doUpdateSet(toInsert))
      .execute();
  }

  async findById(id: string): Promise<ScrapingExecution | null> {
    const row = await db
      .selectFrom("scraping_executions")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    if (!row) return null;
    return {
      id: row.id,
      configId: row.config_id,
      timestamp: new Date(row.timestamp),
      url: row.url,
      rulesUsed: parseJson<any[]>(row.rules_used_json) ?? [],
      result: parseJson<any>(row.result_json),
      resultCount: row.result_count,
      status: row.status as "success" | "error",
      errorMessage: row.error_message ?? undefined,
      duration: row.duration ?? undefined,
    };
  }

  async findAll(): Promise<ScrapingExecution[]> {
    const rows = await db
      .selectFrom("scraping_executions")
      .selectAll()
      .execute();
    return rows.map((row) => ({
      id: row.id,
      configId: row.config_id,
      timestamp: new Date(row.timestamp),
      url: row.url,
      rulesUsed: parseJson<any[]>(row.rules_used_json) ?? [],
      result: parseJson<any>(row.result_json),
      resultCount: row.result_count,
      status: row.status as "success" | "error",
      errorMessage: row.error_message ?? undefined,
      duration: row.duration ?? undefined,
    }));
  }

  async findByConfigId(
    configId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ScrapingExecution[]> {
    const rows = await db
      .selectFrom("scraping_executions")
      .selectAll()
      .where("config_id", "=", configId)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .offset(offset)
      .execute();
    return rows.map((row) => ({
      id: row.id,
      configId: row.config_id,
      timestamp: new Date(row.timestamp),
      url: row.url,
      rulesUsed: parseJson<any[]>(row.rules_used_json) ?? [],
      result: parseJson<any>(row.result_json),
      resultCount: row.result_count,
      status: row.status as "success" | "error",
      errorMessage: row.error_message ?? undefined,
      duration: row.duration ?? undefined,
    }));
  }

  async delete(id: string): Promise<void> {
    await db.deleteFrom("scraping_executions").where("id", "=", id).execute();
  }

  // Metodi non di persistenza (placeholder, da spostare in un service/adapter)
  async execute(configId: string, params?: any): Promise<any> {
    throw new Error(
      "Method not implemented in repository. Use ScrapingService instead.",
    );
  }

  async downloadLogs(configName: string, format: string): Promise<Blob> {
    throw new Error("Method not implemented in repository.");
  }
}
