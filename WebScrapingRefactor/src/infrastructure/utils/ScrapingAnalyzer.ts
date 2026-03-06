import * as cheerio from "cheerio";
import type {
  IScrapingAnalyzerPort,
  AnalyzeOptions,
  DomAnalysisResult,
} from "../../domain/ports/IScrapingAnalyzerPort";
import type { ExtractionRule } from "../../domain/entities/ScrapingConfig";
import type { HttpFetcher } from "../adapters/Scraping/HttpFetcher";
import type { JsBrowserFetcher } from "../adapters/Scraping/JsBrowserFetcher";

export class ScrapingAnalyzer implements IScrapingAnalyzerPort {
  constructor(
    private readonly httpFetcher: HttpFetcher,
    private readonly jsBrowserFetcher: JsBrowserFetcher,
  ) {}

  async fetchAndAnalyze(
    url: string,
    options?: AnalyzeOptions,
  ): Promise<DomAnalysisResult> {
    const html = await this.fetchHtml(url, options);
    return this.analyzeDom(html);
  }

  private async fetchHtml(
    url: string,
    options?: AnalyzeOptions,
  ): Promise<string> {
    if (options?.useJavaScript || options?.waitForSelector) {
      return this.jsBrowserFetcher.fetch({
        url,
        waitForSelector: options?.waitForSelector,
      });
    }

    return this.httpFetcher.fetch({
      url,
      method: options?.method,
      headers: options?.headers,
      body: options?.body,
    });
  }

  private isSemanticItem($: cheerio.CheerioAPI, el: any): boolean {
    const node = $(el);

    let score = 0;

    if (node.find("h1, h2, h3").text().trim().length > 3) score++;
    if (node.find("p").text().trim().length > 20) score++;
    if (node.find("img[src]").length > 0) score++;
    if (node.find("[style*='background-image']").length > 0) score++;
    if (node.find("a[href]").length > 0) score++;
    if (node.attr("record-id")) score++;
    if (node.find("[record-id]").length > 0) score++;
    if (node.find(".profileDescription").length > 0) score++;
    if (node.find(".searchable").length > 0) score++;

    return score >= 2;
  }

  private findSemanticContainer($: cheerio.CheerioAPI): string | null {
    const parentCounts = new Map<string, number>();

    $("[class]").each((_, el) => {
      if (!this.isSemanticItem($, el)) return;

      const parent = $(el).parent();
      if (!parent) return;

      const className = parent.attr("class");
      if (!className) return;

      const classes = className.split(/\s+/);
      classes.forEach(cls => {
        if (!cls) return;
        parentCounts.set(cls, (parentCounts.get(cls) || 0) + 1);
      });
    });

    if (parentCounts.size === 0) return null;

    // determine the most frequent parent class without using iterator spread
    let bestClass: string | null = null;
    let bestCount = 0;
    parentCounts.forEach((count, cls) => {
      if (count > bestCount) {
        bestCount = count;
        bestClass = cls;
      }
    });

    return bestClass ? `.${bestClass}` : null;
  }

  private analyzeDom(html: string): DomAnalysisResult {
    const $ = cheerio.load(html);
    const title = $("title").text().trim();

    const suggestedRules: ExtractionRule[] = [];
    const listSelectors: string[] = [];

    const bestContainer = this.findSemanticContainer($);

    if (!bestContainer) {
      return { title, suggestedRules: [], listSelectors: [] };
    }

    listSelectors.push(bestContainer);

    const sample = $(bestContainer).first();

    // TITLE
    const titleEl = sample.find("h1, h2, h3, .title, .name").first();
    if (titleEl.length) {
      suggestedRules.push({
        fieldName: "title",
        selector: `${bestContainer} ${titleEl.prop("tagName")?.toLowerCase()}`,
        attribute: "text",
        multiple: true,
      });
    }

    // DESCRIPTION
    const descEl = sample.find("p, .description, .profileDescription").first();
    if (descEl.length) {
      suggestedRules.push({
        fieldName: "description",
        selector: `${bestContainer} p, ${bestContainer} .description, ${bestContainer} .profileDescription`,
        attribute: "text",
        multiple: true,
      });
    }

    // IMAGE <img>
    const imgEl = sample.find("img[src]").first();
    if (imgEl.length) {
      suggestedRules.push({
        fieldName: "image",
        selector: `${bestContainer} img[src]`,
        attribute: "src",
        multiple: true,
      });
    }

    // IMAGE background-image
    const bgEl = sample.find("[style*='background-image']").first();
    if (bgEl.length) {
      suggestedRules.push({
        fieldName: "image",
        selector: `${bestContainer} [style*='background-image']`,
        attribute: "style" as any,
        multiple: true,
      });
    }

    // LINK
    const linkEl = sample.find("a[href]").first();
    if (linkEl.length) {
      suggestedRules.push({
        fieldName: "link",
        selector: `${bestContainer} a[href]`,
        attribute: "href",
        multiple: true,
      });
    }

    // TEXT / SEARCHABLE
    const textEl = sample.find(".searchable, span, p").first();
    if (textEl.length) {
      suggestedRules.push({
        fieldName: "text",
        selector: `${bestContainer} .searchable, ${bestContainer} span, ${bestContainer} p`,
        attribute: "text",
        multiple: true,
      });
    }

    return {
      title,
      suggestedRules: suggestedRules.slice(0, 10),
      listSelectors,
    };
  }
}
