import type { IAnalysisRepository } from "../../../domain/ports/IAnalysisRepository";
import type { Analysis } from "../../../domain/entities/Analysis";

export class AnalyzeApiUseCase {
  constructor(private readonly analysisRepository: IAnalysisRepository) {}

  async execute(options: {
    url: string;
    method: "GET" | "POST";
    headers?: Record<string, string>;
    body?: any;
  }): Promise<Analysis> {
    return this.analysisRepository.analyze(options);
  }
}
