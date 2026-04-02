import { db } from "../../database/database";
import { IScrapingExecutionRepository } from "../../../domain/ports/ScrapingConfig/IScrapingExecutionRepository";
import { ScrapingExecution } from "../../../domain/entities/ScrapingExecution";
import { parseJson, toJson } from "../../database/mappers/jsonMapper";
import { randomUUID } from "crypto";

export class ScrapingExecutionRepository implements IScrapingExecutionRepository {
  execute(configId: string, params?: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
  downloadLogs(configName: string, format: string): Promise<Blob> {
    throw new Error("Method not implemented.");
  }

  async save(execution: ScrapingExecution): Promise<void> {
    const id = execution.id || randomUUID();
    const toInsert = {
      id,
      config_id:       execution.configId,
      url:             execution.url,
      rules_used_json: toJson(execution.rulesUsed) ?? "[]",
      result_json:     toJson(execution.result) ?? "{}",
      result_count:    execution.resultCount,
      status:          execution.status,
      error_message:   execution.errorMessage ?? null,
      duration:        execution.duration ?? 0,
      next_page_url:   execution.nextPageUrl ?? null,
      pages_scraped:   execution.pagesScraped ?? 0,
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
    return this.toDomain(row);
  }

  async findAll(): Promise<ScrapingExecution[]> {
    const rows = await db
      .selectFrom("scraping_executions")
      .selectAll()
      .execute();
    return rows.map((row) => this.toDomain(row));
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
    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await db.deleteFrom("scraping_executions").where("id", "=", id).execute();
  }


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: Record<string, any>): ScrapingExecution {
    return {
      id:           row.id,
      configId:     row.config_id,
      timestamp:    new Date(row.timestamp),
      url:          row.url,
      rulesUsed:    parseJson<any[]>(row.rules_used_json) ?? [],
      result:       parseJson<any>(row.result_json),
      resultCount:  row.result_count,
      status:       row.status as "success" | "error",
      errorMessage: row.error_message ?? undefined,
      duration:     row.duration ?? undefined,
      totalItems:   row.result_count ?? undefined,
      nextPageUrl:  row.next_page_url ?? null,
      pagesScraped: row.pages_scraped ?? 0,
    };
  }
}