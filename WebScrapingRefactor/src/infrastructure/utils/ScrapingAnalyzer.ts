import * as cheerio from "cheerio";
import type { IScrapingAnalyzerPort, AnalyzeOptions, DomAnalysisResult } from "../../domain/ports/IScrapingAnalyzerPort";
import type { ExtractionRule } from "../../domain/entities/ScrapingConfig";
import type { HttpFetcher } from "../adapters/Scraping/HttpFetcher";
import type { JsBrowserFetcher } from "../adapters/Scraping/JsBrowserFetcher";

/**
 * Implementazione di IScrapingAnalyzerPort.
 * Responsabilità: fetch HTML grezzo + analisi DOM con Cheerio.
 * Cheerio e la logica di fetch vivono qui — nessun use case li conosce.
 */
export class ScrapingAnalyzer implements IScrapingAnalyzerPort {
  constructor(
    private readonly httpFetcher: HttpFetcher,
    private readonly jsBrowserFetcher: JsBrowserFetcher,
  ) {}

  async fetchAndAnalyze(url: string, options?: AnalyzeOptions): Promise<DomAnalysisResult> {
    const html = await this.fetchHtml(url, options);
    return this.analyzeDom(html);
  }

  private async fetchHtml(url: string, options?: AnalyzeOptions): Promise<string> {
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

  private analyzeDom(html: string): DomAnalysisResult {
    const $ = cheerio.load(html);
    const title = $("title").text().trim();

    const suggestedRules: ExtractionRule[] = [];
    const listSelectors: string[] = [];

    const possibleListContainers = [
      "ul",
      "ol",
      "div[class*=\"list\"]",
      "div[class*=\"items\"]",
      "tbody",
    ];

    possibleListContainers.forEach((selector) => {
      $(selector).each((_, el) => {
        const children = $(el).children();
        if (children.length > 1) {
          const firstChild = children.first();
          const childTag = firstChild.prop("tagName")?.toLowerCase();
          if (childTag && children.length > 2) {
            listSelectors.push(selector);
            suggestedRules.push({
              fieldName: "item_text",
              selector: `${selector} > ${childTag}`,
              attribute: "text",
              multiple: true,
            });
            if (firstChild.find("a").length) {
              suggestedRules.push({
                fieldName: "item_link",
                selector: `${selector} > ${childTag} a`,
                attribute: "href",
                multiple: true,
              });
            }
            if (firstChild.find("img").length) {
              suggestedRules.push({
                fieldName: "item_image",
                selector: `${selector} > ${childTag} img`,
                attribute: "src",
                multiple: true,
              });
            }
          }
        }
      });
    });

    if (suggestedRules.length === 0) {
      $("[class]").each((_, el) => {
        const classAttr = $(el).attr("class");
        if (classAttr && classAttr.split(/\s+/).length === 1) {
          suggestedRules.push({
            fieldName: classAttr,
            selector: `.${classAttr}`,
            attribute: "text",
            multiple: false,
          });
        }
      });
    }

    return {
      title,
      suggestedRules: suggestedRules.slice(0, 10),
      listSelectors,
    };
  }
}