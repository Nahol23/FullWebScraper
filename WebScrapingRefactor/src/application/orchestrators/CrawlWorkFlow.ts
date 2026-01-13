import { GenerateSiteMapUseCase } from "../usecases/crawling/GenerateSiteMapUseCase";
import { StartCrawlUseCase } from "../usecases/crawling/StartCrawlUseCase";
import { GetCrawlStatusUseCase } from "../usecases/crawling/GetCrawlStatusUseCase";
import { PageDTO } from "../dto/PageDto";
import { ScrapeSelectedPagesUseCase } from "../usecases/crawling/ScrapeSelectedPageUseCase";

export class CrawlWorkflow {
  constructor(
    private siteMapper: GenerateSiteMapUseCase,
    private startCrawl: StartCrawlUseCase,
    private getStatus: GetCrawlStatusUseCase,
    private scraper: ScrapeSelectedPagesUseCase
  ) {}

  /**
   * Esegue l'intero flusso di crawling:
   * 1. Genera la site map
   * 2. Avvia un crawl asincrono
   * 3. Recupera lo stato del crawl
   * 4. Scrapa e filtra le pagine nella lingua richiesta
   */
  async execute(seedUrl: string, language: "it" | "en", limit: number = 20): Promise<PageDTO[]> {
    // 1. Genera la site map
    const siteMap = await this.siteMapper.execute(seedUrl, limit);

    // 2. Avvia un crawl asincrono
    const crawlId = await this.startCrawl.execute(seedUrl, limit);

    // 3. Recupera lo stato del crawl (quando completato)
    const crawledPages = await this.getStatus.execute(crawlId);

    // 4. Scrapa e filtra le pagine nella lingua richiesta
    const filteredPages = await this.scraper.execute(siteMap.urls, language);

    return filteredPages;
  }
}
