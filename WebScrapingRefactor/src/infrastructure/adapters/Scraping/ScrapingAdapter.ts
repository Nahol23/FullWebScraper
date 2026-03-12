import type { IScrapingPort } from "../../../domain/ports/IScrapingPort";
import type { IHtmlExtractorPort } from "../../../domain/ports/IHtmlExtractorPort";
import type { ScrapeOptions } from "../../../domain/types/ScrapeOptions";
import type { HttpFetcher } from "./HttpFetcher";
import type { JsBrowserFetcher } from "./JsBrowserFetcher";


export class ScrapingAdapter implements IScrapingPort {
  constructor(
    private readonly httpFetcher: HttpFetcher,
    private readonly jsBrowserFetcher: JsBrowserFetcher,
    private readonly htmlExtractor: IHtmlExtractorPort,
  ) {}

  async scrape(options: ScrapeOptions): Promise<Record<string, any>> {
    const html = await this.fetchHtml(options);
    return this.htmlExtractor.extract(
      html,
      options.rules,
      options.containerSelector,
    ) as Record<string, any>;
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
}