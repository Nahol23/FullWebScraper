import type {ScrapeOptions}  from "../types/ScrapeOptions";

export interface IScrapingPort {
  scrape(options: ScrapeOptions): Promise<Record<string, any>>;
}