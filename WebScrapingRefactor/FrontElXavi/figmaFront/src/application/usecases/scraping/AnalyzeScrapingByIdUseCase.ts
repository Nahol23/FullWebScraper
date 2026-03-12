import type { IScrapingAnalysisRepository } from "../../../domain/ports/scraping/IScrapingAnalysisRepository";
import type { ScrapingAnalysisResponse} from "../../../domain/entities/ScrapingAnalysisResult";

export class AnalyzeScrapingByIdUseCase {
  constructor(private readonly analysisRepository: IScrapingAnalysisRepository) {}

  async execute(
    configId: string,
    options?: {
      useJavaScript?: boolean;
      waitForSelector?: string;
    }
  ): Promise<ScrapingAnalysisResponse> {
    return this.analysisRepository.analyzeById(configId, options);
  }
}