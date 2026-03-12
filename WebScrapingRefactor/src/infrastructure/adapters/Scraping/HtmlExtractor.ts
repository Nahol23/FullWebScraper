import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { ExtractionRule } from "../../../domain/entities/ScrapingConfig";
import type { IHtmlExtractorPort } from "../../../domain/ports/IHtmlExtractorPort";
import { ScrapingError } from "../..//../domain/errors/ScrapingError";

/**
 * Implementazione di IHtmlExtractorPort tramite Cheerio.
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

  /**
   * Iterates every element matching containerSelector and extracts one value
   * per rule per container.
   *
   * KEY FIX: the `multiple` flag on a rule means "collect all matches from
   * the whole page" and only makes sense in extractSingle. Inside a container
   * loop the repetition is already provided by the container iteration itself,
   * so we ALWAYS take the first match per rule. Using `multiple: true` here
   * was causing each field to return an array of ALL matching nodes from the
   * entire sub-tree (e.g. every `.title` on the page repeated inside every
   * container object).
   */
  private extractFromContainers(
    $: cheerio.CheerioAPI,
    rules: ExtractionRule[],
    containerSelector: string,
  ): Record<string, any>[] {
    const items: Record<string, any>[] = [];

    $(containerSelector).each((_, container) => {
      const item: Record<string, any> = {};

      for (const rule of rules) {
        const node = $(container).find(rule.selector).first();
        item[rule.fieldName] = this.extractValue(node, rule.attribute);
      }

      const hasData = Object.values(item).some((v) => v !== "");
      if (hasData) {
        items.push(item);
      }
    });

    return items;
  }

  /**
   * Extracts from the whole document without a container.
   * Here `multiple: true` collects all matching nodes into an array,
   * which is the intended behaviour for flat, non-list pages.
   */
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

    if (!attribute || attribute === "text" || attribute === "innerText") {
      return $el.text().trim();
    }

    if (attribute === "html") {
      return $el.html()?.trim() ?? "";
    }

    if (attribute === "style") {
      const style = $el.attr("style") ?? "";
      const match = style.match(/background-image:\s*url\(["']?(.*?)["']?\)/i);
      if (match && match[1]) return match[1].trim();
      return style.trim();
    }

    return $el.attr(attribute)?.trim() ?? "";
  }
}
