import { httpClient } from "./ioc";
import { ScrapingConfigRepository } from "../infrastructure/scraping/ScrapingConfigRepository";
import { ScrapingExecutionRepository } from "../infrastructure/scraping/ScrapingExecutionRepository";
import { ScrapingAnalysisRepository } from "../infrastructure/scraping/ScrapingAnalysisRepository";

// Use Cases Config
import { GetScrapingConfigsUseCase } from "../application/usecases/scraping/GetScrapingConfigsUseCase";
import { GetScrapingConfigByIdUseCase } from "../application/usecases/scraping/GetScrapingConfigByIdUseCase";
import { SaveScrapingConfigUseCase } from "../application/usecases/scraping/SaveScrapingConfigUseCase";
import { UpdateScrapingConfigUseCase } from "../application/usecases/scraping/UpdateScrapingConfigUseCase";
import { DeleteScrapingConfigUseCase } from "../application/usecases/scraping/DeleteScrapingConfigUseCase";

// Use Cases Execution
import { ExecuteScrapingByNameUseCase } from "../application/usecases/scraping/ExecuteScrapingByNameUseCase";
import { FetchScrapingLogsUseCase } from "../application/usecases/scraping/FetchScrapingLogsUseCase";
import { DeleteScrapingExecutionUseCase } from "../application/usecases/scraping/DeleteScrapingExecutionUseCase";
import { DownloadScrapingLogsUseCase } from "../application/usecases/scraping/DownloadScrapingLogsUseCase";

// Use Cases Analysis
import { AnalyzeScrapingUseCase } from "../application/usecases/scraping/AnalyzeScrapingUseCase";
import { AnalyzeScrapingByIdUseCase } from "../application/usecases/scraping/AnalyzeScrapingByIdUseCase";

// Repository instances
const scrapingConfigRepository = new ScrapingConfigRepository(httpClient);
const scrapingExecutionRepository = new ScrapingExecutionRepository(httpClient);
const scrapingAnalysisRepository = new ScrapingAnalysisRepository(httpClient);

// Export use cases
export const getScrapingConfigsUseCase = new GetScrapingConfigsUseCase(
  scrapingConfigRepository,
);
export const getScrapingConfigByIdUseCase = new GetScrapingConfigByIdUseCase(
  scrapingConfigRepository,
);
export const saveScrapingConfigUseCase = new SaveScrapingConfigUseCase(
  scrapingConfigRepository,
);
export const updateScrapingConfigUseCase = new UpdateScrapingConfigUseCase(
  scrapingConfigRepository,
);
export const deleteScrapingConfigUseCase = new DeleteScrapingConfigUseCase(
  scrapingConfigRepository,
);

export const executeScrapingByNameUseCase = new ExecuteScrapingByNameUseCase(
  scrapingExecutionRepository,
);
export const fetchScrapingLogsUseCase = new FetchScrapingLogsUseCase(
  scrapingExecutionRepository,
);
export const deleteScrapingExecutionUseCase =
  new DeleteScrapingExecutionUseCase(scrapingExecutionRepository);
export const downloadScrapingLogsUseCase = new DownloadScrapingLogsUseCase(
  scrapingExecutionRepository,
);

export const analyzeScrapingUseCase = new AnalyzeScrapingUseCase(
  scrapingAnalysisRepository,
);
export const analyzeScrapingByIdUseCase = new AnalyzeScrapingByIdUseCase(
  scrapingAnalysisRepository,
);
export { scrapingExecutionRepository };
