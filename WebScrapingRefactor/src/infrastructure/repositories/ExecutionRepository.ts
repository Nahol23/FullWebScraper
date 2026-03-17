import { db } from "../database/database";
import { Execution } from "../../domain/entities/Execution";
import { IExecutionRepository } from "../../domain/ports/Execution/IExecutionRepository";
import { parseJson, toJson } from "../database/mappers/jsonMapper";
import { randomUUID } from "crypto";

export class ExecutionRepository implements IExecutionRepository {
  async findAll(): Promise<Execution[]> {
    const rows = await db.selectFrom("executions").selectAll().execute();
    return rows.map((row) => ({
      id: row.id,
      configId: row.config_id,
      timestamp: new Date(row.timestamp),
      parametersUsed:
        parseJson<Record<string, any>>(row.parameters_used_json) ?? {},
      resultCount: row.result_count,
      status: row.status as "success" | "error",
      errorMessage: row.error_message ?? undefined,
    }));
  }

  async findById(id: string): Promise<Execution | null> {
    const row = await db
      .selectFrom("executions")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    if (!row) return null;
    return {
      id: row.id,
      configId: row.config_id,
      timestamp: new Date(row.timestamp),
      parametersUsed:
        parseJson<Record<string, any>>(row.parameters_used_json) ?? {},
      resultCount: row.result_count,
      status: row.status as "success" | "error",
      errorMessage: row.error_message ?? undefined,
    };
  }

  async findByConfigId(configId: string): Promise<Execution[]> {
    const rows = await db
      .selectFrom("executions")
      .selectAll()
      .where("config_id", "=", configId)
      .execute();
    return rows.map((row) => ({
      id: row.id,
      configId: row.config_id,
      timestamp: new Date(row.timestamp),
      parametersUsed:
        parseJson<Record<string, any>>(row.parameters_used_json) ?? {},
      resultCount: row.result_count,
      status: row.status as "success" | "error",
      errorMessage: row.error_message ?? undefined,
    }));
  }

  async save(execution: Execution): Promise<void> {
    const id = execution.id || randomUUID();
    const toInsert = {
      id,
      config_id: execution.configId,
      parameters_used_json: toJson(execution.parametersUsed) ?? "{}",
      result_count: execution.resultCount,
      status: execution.status,
      error_message: execution.errorMessage ?? null,
    };
    await db
      .insertInto("executions")
      .values(toInsert)
      .onConflict((oc) => oc.column("id").doUpdateSet(toInsert))
      .execute();
  }

  async delete(id: string): Promise<void> {
    await db.deleteFrom("executions").where("id", "=", id).execute();
  }
}
