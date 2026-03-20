import type { ScrapeOptions } from "../types/ScrapeOptions";
import type { ScrapingResult } from "../types/ScrapingResult";

export interface IScrapingPort {
  scrape(options: ScrapeOptions): Promise<ScrapingResult>;
}