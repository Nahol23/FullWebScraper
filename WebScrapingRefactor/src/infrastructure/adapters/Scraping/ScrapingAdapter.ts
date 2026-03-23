import type { IScrapingPort } from "../../../domain/ports/IScrapingPort";
import type { IHtmlExtractorPort } from "../../../domain/ports/IHtmlExtractorPort";
import type { ScrapeOptions } from "../../../domain/types/ScrapeOptions";
import type { ScrapingResult } from "../../../domain/types/ScrapingResult";
import type { HttpFetcher } from "./HttpFetcher";
import type { JsBrowserFetcher } from "./JsBrowserFetcher";
import { PaginationStrategyFactory } from "../../../domain/services/pagination/PaginationStrategyFactory";

const DEFAULT_MAX_PAGES = 10;

export class ScrapingAdapter implements IScrapingPort {
  constructor(
    private readonly httpFetcher: HttpFetcher,
    private readonly jsBrowserFetcher: JsBrowserFetcher,
    private readonly htmlExtractor: IHtmlExtractorPort,
  ) {}

  async scrape(options: ScrapeOptions): Promise<ScrapingResult> {
    const strategy = PaginationStrategyFactory.create(options.pagination);

    if (!strategy) {
      const html = await this.fetchHtml(options);
      const extracted = this.htmlExtractor.extract(
        html,
        options.rules,
        options.containerSelector,
      );
      return {
        items: this.toArray(extracted),
        nextPageUrl: null,
        pagesScraped: 1,
      };
    }

    // ── Con paginazione 
    const maxPages = options.pagination?.maxPages ?? DEFAULT_MAX_PAGES;
    const accumulated: Record<string, unknown>[] = [];

    // Risolve l'URL di partenza (prima run o resume)
    let currentUrl = this.resolveStartUrl(options);
    let page = 0;
    let pendingNextUrl: string | null = null;

    while (page < maxPages) {
      const html = await this.fetchHtml({ ...options, url: currentUrl });

      const extracted = this.htmlExtractor.extract(
        html,
        options.rules,
        options.containerSelector,
      );
      accumulated.push(...this.toArray(extracted));
      page++;

      pendingNextUrl = await strategy.getNextUrl(currentUrl, html);

      // Nessuna pagina successiva → fine naturale
      if (pendingNextUrl === null) break;

      currentUrl = pendingNextUrl;
    }

    return {
      items: accumulated,
      // Se pendingNextUrl !== null significa che ci sono altre pagine oltre maxPages
      nextPageUrl: pendingNextUrl,
      pagesScraped: page,
    };
  }



  /**
   * Per urlParam: applica startPage al query param se specificato.
   * Per nextSelector: usa resumeFromUrl come URL iniziale se specificato.
   * Altrimenti ritorna l'URL originale.
   */
  private resolveStartUrl(options: ScrapeOptions): string {
    const p = options.pagination;
    if (!p) return options.url;

    if (p.type === "nextSelector" && p.resumeFromUrl) {
      return p.resumeFromUrl;
    }

    if (p.type === "urlParam" && p.paramName && p.startPage && p.startPage > 1) {
      try {
        const url = new URL(options.url);
        url.searchParams.set(p.paramName, p.startPage.toString());
        return url.toString();
      } catch {
        return options.url;
      }
    }

    return options.url;
  }

  private async fetchHtml(options: ScrapeOptions): Promise<string> {
    if (options.useJavaScript || options.waitForSelector) {
      return this.jsBrowserFetcher.fetch({
        url: options.url,
        waitForSelector: options.waitForSelector,
      });
    }
    return this.httpFetcher.fetch({
      url: options.url,
      method: options.method,
      headers: options.headers,
      body: options.body,
    });
  }

  private toArray(
    result: Record<string, unknown> | Record<string, unknown>[],
  ): Record<string, unknown>[] {
    return Array.isArray(result) ? result : [result];
  }
}