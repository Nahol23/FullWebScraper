import { ScrapingAnalysis } from "../../entities/ScrapingAnalysis";


export interface IScrapingAnalysisRepository {
  save(analysis: ScrapingAnalysis): Promise<void>;
  findById(id: string): Promise<ScrapingAnalysis | null>;
  findAll(): Promise<ScrapingAnalysis[]>;
  delete(id: string): Promise<void>;
}