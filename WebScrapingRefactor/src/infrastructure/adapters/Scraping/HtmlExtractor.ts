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
        const nodes = $(container).find(rule.selector);

        if (rule.multiple) {
          item[rule.fieldName] = nodes
            .map((_, el) => this.extractValue($(el), rule.attribute))
            .get();
        } else {
          item[rule.fieldName] = this.extractValue(nodes.first(), rule.attribute);
        }
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
      const nodes = $(rule.selector);

      result[rule.fieldName] = rule.multiple
        ? nodes.map((_, el) => this.extractValue($(el), rule.attribute)).get()
        : this.extractValue(nodes.first(), rule.attribute);
    }

    return result;
  }

  private extractValue(
    $el: cheerio.Cheerio<AnyNode>,
    attribute?: string,
  ): string {
    if (!$el || $el.length === 0) return "";

    // TEXT / INNER TEXT
    if (!attribute || attribute === "text" || attribute === "innerText") {
      return $el.text().trim();
    }

    // RAW HTML
    if (attribute === "html") {
      return $el.html()?.trim() ?? "";
    }

    // BACKGROUND-IMAGE
    if (attribute === "style") {
      const style = $el.attr("style") ?? "";
      const match = style.match(/background-image:\s*url\(["']?(.*?)["']?\)/i);
      if (match && match[1]) return match[1].trim();
      return style.trim();
    }

    // GENERIC ATTRIBUTES (href, src, data-*, ecc.)
    return $el.attr(attribute)?.trim() ?? "";
  }
}
