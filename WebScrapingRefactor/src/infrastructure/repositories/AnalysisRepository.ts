import { db } from "../database/database";
import { Analysis } from "../../domain/entities/Analysis";
import { IAnalysisRepository } from "../../domain/ports/Analyze/IAnalysisRepository";
import { parseJson, toJson } from "../database/mappers/jsonMapper";
import { randomUUID } from "crypto";
import { ApiParam } from "../../domain/value-objects/ApiParam";

export class AnalysisRepository implements IAnalysisRepository {
  async findAll(): Promise<Analysis[]> {
    const rows = await db.selectFrom("analyses").selectAll().execute();
    return rows.map((row) => ({
      id: row.id,
      url: row.url,
      method: row.method as "GET" | "POST",
      body: parseJson<unknown>(row.body_json),
      headers: parseJson<Record<string, string>>(row.headers_json),
      status: row.status as "pending" | "completed" | "failed",
      discoveredSchema: parseJson<{
        suggestedFields: string[];
        dataPath?: string | null;
        params: ApiParam[];
      }>(row.discovered_schema_json),
      createdAt: new Date(row.created_at),
    }));
  }

  async findById(id: string): Promise<Analysis | null> {
    const row = await db
      .selectFrom("analyses")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    if (!row) return null;
    return {
      id: row.id,
      url: row.url,
      method: row.method as "GET" | "POST",
      body: parseJson<unknown>(row.body_json),
      headers: parseJson<Record<string, string>>(row.headers_json),
      status: row.status as "pending" | "completed" | "failed",
      discoveredSchema: parseJson<{
        suggestedFields: string[];
        dataPath?: string | null;
        params: ApiParam[];
      }>(row.discovered_schema_json),
      createdAt: new Date(row.created_at),
    };
  }

  async save(analysis: Analysis): Promise<void> {
    const id = analysis.id || randomUUID();
    const toInsert = {
      id,
      url: analysis.url,
      method: analysis.method,
      body_json: toJson(analysis.body),
      headers_json: toJson(analysis.headers),
      status: analysis.status,
      discovered_schema_json: toJson(analysis.discoveredSchema),
    };
    await db
      .insertInto("analyses")
      .values(toInsert)
      .onConflict((oc) => oc.column("id").doUpdateSet(toInsert))
      .execute();
  }

  async delete(id: string): Promise<void> {
    await db.deleteFrom("analyses").where("id", "=", id).execute();
  }
}
