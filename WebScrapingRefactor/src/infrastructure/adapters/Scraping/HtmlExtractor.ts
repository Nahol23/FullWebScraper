import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { ExtractionRule } from "../../../domain/entities/ScrapingConfig";
import type { IHtmlExtractorPort } from "../../../domain/ports/IHtmlExtractorPort";
import { ScrapingError } from "../..//../domain/errors/ScrapingError";

/**
 * Implementazione di IHtmlExtractorPort tramite Cheerio.
 * Nessuna classe esterna sa che viene usato Cheerio —
 * dipendono solo dall'interfaccia del dominio.
 */
export class HtmlExtractor implements IHtmlExtractorPort {
  extract(
    html: string,
    rules: ExtractionRule[],
    containerSelector?: string,
  ): Record<string, any> | Record<string, any>[] {
    try {
      const $ = cheerio.load(html);
      return containerSelector
        ? this.extractFromContainers($, rules, containerSelector)
        : this.extractSingle($, rules);
    } catch (err) {
      if (err instanceof ScrapingError) throw err;
      throw new ScrapingError(
        "EXTRACTION_ERROR",
        "Errore durante l'estrazione HTML",
        err,
      );
    }
  }

  private extractFromContainers(
    $: cheerio.CheerioAPI,
    rules: ExtractionRule[],
    containerSelector: string,
  ): Record<string, any>[] {
    const items: Record<string, any>[] = [];

    $(containerSelector).each((_, container) => {
      const item: Record<string, any> = {};
      for (const rule of rules) {
        item[rule.fieldName] = rule.multiple
          ? $(container)
              .find(rule.selector)
              .map((_, el) => this.extractValue($(el), rule.attribute))
              .get()
          : this.extractValue(
              $(container).find(rule.selector).first(),
              rule.attribute,
            );
      }
      items.push(item);
    });

    return items;
  }

  private extractSingle(
    $: cheerio.CheerioAPI,
    rules: ExtractionRule[],
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const rule of rules) {
      const elements = $(rule.selector);
      result[rule.fieldName] = rule.multiple
        ? elements.map((_, el) => this.extractValue($(el), rule.attribute)).get()
        : this.extractValue(elements.first(), rule.attribute);
    }

    return result;
  }

  private extractValue(
    $el: cheerio.Cheerio<AnyNode>,
    attribute?: string,
  ): string {
    if (!attribute || attribute === "innerText") return $el.text().trim();
    if (attribute === "html") return $el.html()?.trim() ?? "";
    if (attribute === "style") {
      return $el.attr("style")?.match(/url\(["']?(.*?)["']?\)/)?.[1] ?? "";
    }
    // Gestisce href, src, data-*, e qualsiasi altro attributo HTML
    return $el.attr(attribute)?.trim() ?? "";
  }
}