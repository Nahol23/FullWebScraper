import type { IScrapingAnalysisRepository } from "../../../domain/ports/scraping/IScrapingAnalysisRepository";
import type { ScrapingAnalysisResponse } from "../../../domain/entities/ScrapingAnalysisResult";

export class AnalyzeScrapingUseCase {
  constructor(
    private readonly analysisRepository: IScrapingAnalysisRepository,
  ) {}

  async execute(options: {
    url: string;
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: any;
    useJavaScript?: boolean;
    waitForSelector?: string;
  }): Promise<ScrapingAnalysisResponse> {
    return this.analysisRepository.analyze(options);
  }
}
