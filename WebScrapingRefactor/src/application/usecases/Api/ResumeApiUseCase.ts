import type { IExecutionRepository } from "../../../domain/ports/Execution/IExecutionRepository";
import type { IConfigRepository } from "../../../domain/ports/IConfigRepository";
import type { ExecuteApiUseCase } from "./ExecuteApiUseCase";

export interface ResumeApiResult {
  alreadyComplete: boolean;
  data: unknown[];
  nextPageUrl: string | null;
  meta: {
    pagesScraped: number;
    totalItems: number;
  };
}

export class ResumeApiUseCase {
  constructor(
    private readonly configRepo: IConfigRepository,
    private readonly executionRepo: IExecutionRepository,
    private readonly executeUseCase: ExecuteApiUseCase,
  ) {}

  async execute(configId: string, maxPages?: number): Promise<ResumeApiResult> {
    const executions = await this.executionRepo.findByConfigId(configId);
    const last = executions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    )[0];

    console.log(
      "[ResumeApiUseCase] last execution:",
      JSON.stringify(last, null, 2),
    ); // ← aggiungi

    if (!last) {
      throw new Error(`Nessuna execution trovata per configId "${configId}"`);
    }

    if (last.nextPageUrl === null) {
      console.log("[ResumeApiUseCase] alreadyComplete — nextPageUrl is null"); // ← aggiungi
      return {
        alreadyComplete: true,
        data: [],
        nextPageUrl: null,
        meta: { pagesScraped: 0, totalItems: 0 },
      };
    }

    const config = await this.configRepo.findById(configId);
    if (!config) {
      throw new Error(`Configurazione "${configId}" non trovata`);
    }

    const runtimeParams: Record<string, unknown> = {
      maxPages,
      startPage: this.extractPageNumber(
        last.nextPageUrl,
        config.pagination?.paramName ?? "__bodyPage",
      ),
      resumeFromUrl: last.nextPageUrl,
    };

    console.log(
      "[ResumeApiUseCase] runtimeParams:",
      JSON.stringify(runtimeParams, null, 2),
    ); // ← aggiungi

    const result = (await this.executeUseCase.execute(
      configId,
      runtimeParams,
    )) as {
      data?: unknown[];
      nextPageUrl?: string | null;
      meta?: { pagesScraped?: number; totalItems?: number };
    };

    console.log(
      "[ResumeApiUseCase] result from ExecuteApiUseCase:",
      JSON.stringify(result, null, 2),
    ); // ← aggiungi

    return {
      alreadyComplete: false,
      data: result.data ?? [],
      nextPageUrl: result.nextPageUrl ?? null,
      meta: {
        pagesScraped: result.meta?.pagesScraped ?? 1,
        totalItems: result.meta?.totalItems ?? result.data?.length ?? 0,
      },
    };
  }

  private extractPageNumber(url: string, paramName?: string): number {
    if (!paramName) return 1;
    try {
      return parseInt(new URL(url).searchParams.get(paramName) ?? "1", 10);
    } catch {
      return 1;
    }
  }
}
