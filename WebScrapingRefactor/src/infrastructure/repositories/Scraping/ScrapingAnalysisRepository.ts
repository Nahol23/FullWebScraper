import { db } from "../../database/database";
import { IScrapingAnalysisRepository } from "../../../domain/ports/ScrapingConfig/IScrapingAnalysisRepository";
import { ScrapingAnalysis } from "../../../domain/entities/ScrapingAnalysis";
import { parseJson, toJson } from "../../database/mappers/jsonMapper";
import { randomUUID } from "crypto";

export class ScrapingAnalysisRepository implements IScrapingAnalysisRepository {
  async save(analysis: ScrapingAnalysis): Promise<void> {
    const id = analysis.id || randomUUID();
    const toInsert = {
      id,
      url: analysis.url,
      options_json: toJson(analysis.options),
      result_json: toJson(analysis.result) ?? "{}",
      status: analysis.status,
      error_message: analysis.errorMessage ?? null,
    };
    await db
      .insertInto("scraping_analyses")
      .values(toInsert)
      .onConflict((oc) => oc.column("id").doUpdateSet(toInsert))
      .execute();
  }

  async findById(id: string): Promise<ScrapingAnalysis | null> {
    const row = await db
      .selectFrom("scraping_analyses")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    if (!row) return null;
    return {
      id: row.id,
      url: row.url,
      timestamp: new Date(row.timestamp),
      options: parseJson<any>(row.options_json),
      result: parseJson<any>(row.result_json),
      status: row.status as "completed" | "failed",
      errorMessage: row.error_message ?? undefined,
    };
  }

  async findAll(): Promise<ScrapingAnalysis[]> {
    const rows = await db.selectFrom("scraping_analyses").selectAll().execute();
    return rows.map((row) => ({
      id: row.id,
      url: row.url,
      timestamp: new Date(row.timestamp),
      options: parseJson<any>(row.options_json),
      result: parseJson<any>(row.result_json),
      status: row.status as "completed" | "failed",
      errorMessage: row.error_message ?? undefined,
    }));
  }

  async delete(id: string): Promise<void> {
    await db.deleteFrom("scraping_analyses").where("id", "=", id).execute();
  }
}
