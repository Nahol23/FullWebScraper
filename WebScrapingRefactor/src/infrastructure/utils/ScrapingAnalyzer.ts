import * as cheerio from "cheerio";
import { AnyNode } from "domhandler";
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

  private isSemanticItem($: cheerio.CheerioAPI, el: AnyNode): boolean {
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

    $("[class]").each((_, el: AnyNode) => {
      if (!this.isSemanticItem($, el)) return;

      const parent = $(el).parent();
      if (!parent) return;

      const className = parent.attr("class");
      if (!className) return;

      const classes = className.split(/\s+/);
      classes.forEach((cls: string) => {
        if (!cls) return;
        parentCounts.set(cls, (parentCounts.get(cls) || 0) + 1);
      });
    });

    if (parentCounts.size === 0) return null;

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

    // Genera un selettore relativo all'interno del contenitore
    const generateSelector = (el: cheerio.Cheerio<AnyNode>): string => {
      if (!el || el.length === 0) return "";

      const id = el.attr("id");
      if (id) return `#${id}`;

      const classAttr = el.attr("class");
      if (classAttr) {
        const classes = classAttr.split(/\s+/).filter((c: string) => c.length > 0);
        if (classes.length > 0) {
          return classes.map((c: string) => `.${c}`).join("");
        }
      }

      const tagName = el.prop("tagName")?.toLowerCase();
      return tagName || "*";
    };

    const addRule = (
      fieldName: string,
      selector: string,
      attribute?: ExtractionRule["attribute"],
      multiple?: boolean,
    ) => {
      if (selector) {
        suggestedRules.push({
          fieldName,
          selector,
          attribute: attribute || "text",
          multiple: multiple !== undefined ? multiple : true,
        });
      }
    };

    // TITLE
    const titleEl = sample.find("h1, h2, h3, .title, .name").first();
    if (titleEl.length) {
      addRule("title", generateSelector(titleEl), "text");
    }

    // DESCRIPTION
    const descEl = sample.find("p, .description, .profileDescription").first();
    if (descEl.length) {
      addRule("description", generateSelector(descEl), "text");
    }

    // IMAGE da <img>
    const imgEl = sample.find("img[src]").first();
    if (imgEl.length) {
      addRule("image", generateSelector(imgEl), "src");
    }

    // IMAGE da background-image
    const bgEl = sample.find("[style*='background-image']").first();
    if (bgEl.length) {
      addRule("image", generateSelector(bgEl), "style");
    }

    // LINK
    const linkEl = sample.find("a[href]").first();
    if (linkEl.length) {
      addRule("link", generateSelector(linkEl), "href");
    }

    // TEXT generico
    const textEl = sample.find(".searchable, span, p").first();
    if (textEl.length) {
      addRule("text", generateSelector(textEl), "text");
    }

    return {
      title,
      suggestedRules: suggestedRules.slice(0, 10),
      listSelectors,
    };
  }
}