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

  // ─── Semantic scoring ────────────────────────────────────────────────────────

  /**
   * Scores an element as a self-contained semantic "item".
   * Used to identify repeating item containers directly (not their parent).
   */
  private semanticScore($: cheerio.CheerioAPI, el: AnyNode): number {
    const node = $(el);
    let score = 0;

    if (node.find("h1, h2, h3, h4").text().trim().length > 3) score += 2;
    if (node.find("p").text().trim().length > 20) score++;
    if (node.find("img[src]").length > 0) score++;
    if (node.find("[style*='background-image']").length > 0) score++;
    if (node.find("a[href]").length > 0) score++;
    if (node.attr("record-id")) score += 2;
    if (node.find("[record-id]").length > 0) score += 2;
    if (node.find(".profileDescription").length > 0) score++;
    if (node.find(".searchable").length > 0) score++;

    return score;
  }

  /**
   * Finds the repeating container selector directly.
   *
   * ALGORITHM:
   * 1. Score every element with a class attribute.
   * 2. Collect elements with score >= 2 as "semantic items".
   * 3. Group them by their own CSS selector (tag + first meaningful class).
   * 4. The selector that appears most often with consistent structure = container.
   *
   * FIX vs old version: we track the ITEM ITSELF, not its parent.
   * The old version walked up to the parent which returned the wrapper div
   * rather than the repeating row element.
   */
  private findRepeatingContainer($: cheerio.CheerioAPI): string | null {
    const selectorCounts = new Map<string, number>();

    $("[class]").each((_, el: AnyNode) => {
      if (this.semanticScore($, el) < 2) return;

      const selector = this.buildStableSelector($, el);
      if (!selector) return;

      selectorCounts.set(selector, (selectorCounts.get(selector) || 0) + 1);
    });

    if (selectorCounts.size === 0) return null;

    // Pick the selector that repeats the most
    let bestSelector: string | null = null;
    let bestCount = 1; // must appear at least twice to be a "list"

    selectorCounts.forEach((count, selector) => {
      if (count > bestCount) {
        bestCount = count;
        bestSelector = selector;
      }
    });

    return bestSelector;
  }

  /**
   * Builds a stable, minimal CSS selector for an element using:
   * - Its id (most specific, if present)
   * - Its tag + first non-utility class (avoids layout noise like col-md-8)
   */
  private buildStableSelector($: cheerio.CheerioAPI, el: AnyNode): string | null {
    const node = $(el);

    const id = node.attr("id");
    if (id) return `#${id}`;

    const tag = (node.prop("tagName") as string | undefined)?.toLowerCase();
    const classAttr = node.attr("class") ?? "";

    // Filter out pure layout/grid utility classes that are not semantic
    const meaningfulClass = classAttr
      .split(/\s+/)
      .filter((c) =>
        c.length > 1 &&
        !/^(col-|row$|container|wrapper|clearfix|pull-|push-|offset-|d-|flex|grid|float-|align-|justify-|p-|m-|px-|py-|mx-|my-|pt-|pb-|pl-|pr-|mt-|mb-|ml-|mr-|text-|bg-|border-|rounded|shadow|w-|h-|min-|max-)/.test(c),
      )
      .find(Boolean); // first meaningful one

    if (!meaningfulClass) return tag ?? null;
    return tag ? `${tag}.${meaningfulClass}` : `.${meaningfulClass}`;
  }

  // ─── Selector generation for rules ──────────────────────────────────────────

  /**
   * Generates a RELATIVE selector for a child element within its container.
   * Prefers tag-based selectors for robustness; falls back to first class.
   * Never returns layout-only class selectors.
   */
  private generateRelativeSelector(
    $: cheerio.CheerioAPI,
    el: cheerio.Cheerio<AnyNode>,
  ): string {
    if (!el || el.length === 0) return "";

    const tag = (el.prop("tagName") as string | undefined)?.toLowerCase() ?? "";

    // Prefer semantic tags directly
    if (["h1", "h2", "h3", "h4", "h5", "h6", "a", "img", "p", "span"].includes(tag)) {
      const classAttr = el.attr("class") ?? "";
      const firstClass = classAttr.split(/\s+/).find(
        (c) => c.length > 1 && !/^(col-|row|container|d-|flex|text-sm|text-xs|font-)/.test(c),
      );
      if (firstClass) return `${tag}.${firstClass}`;
      return tag;
    }

    // For divs/sections, use first meaningful class
    const classAttr = el.attr("class") ?? "";
    const firstClass = classAttr.split(/\s+/).find(
      (c) =>
        c.length > 1 &&
        !/^(col-|row$|container|wrapper|clearfix|d-|flex|grid|p-|m-)/.test(c),
    );

    if (firstClass) return `.${firstClass}`;

    const id = el.attr("id");
    if (id) return `#${id}`;

    return tag || "*";
  }

  // ─── DOM analysis ────────────────────────────────────────────────────────────

  private analyzeDom(html: string): DomAnalysisResult {
    const $ = cheerio.load(html);
    const title = $("title").text().trim();

    const containerSelector = this.findRepeatingContainer($);

    if (!containerSelector) {
      // Fallback: no repeating container found — extract flat rules from whole page
      return {
        title,
        suggestedRules: this.buildFlatRules($),
        listSelectors: [],
      };
    }

    const rules = this.buildContainerRules($, containerSelector);

    return {
      title,
      suggestedRules: rules,
      listSelectors: [containerSelector],
    };
  }

  /**
   * Builds rules scoped to a detected repeating container.
   * Uses the FIRST matching container as a sample.
   * All rules get multiple: false — the container loop handles repetition.
   */
  private buildContainerRules(
    $: cheerio.CheerioAPI,
    containerSelector: string,
  ): ExtractionRule[] {
    const sample = $(containerSelector).first();
    if (!sample.length) return [];

    const rules: ExtractionRule[] = [];
    const usedFields = new Set<string>();

    const addRule = (
      fieldName: string,
      selector: string,
      attribute: ExtractionRule["attribute"],
    ) => {
      if (!selector || usedFields.has(fieldName)) return;
      usedFields.add(fieldName);
      // multiple: false because container iteration provides the repetition
      rules.push({ fieldName, selector, attribute, multiple: false });
    };

    // Title
    const titleEl = sample.find("h1, h2, h3, h4, .title, .name").first();
    if (titleEl.length) {
      addRule("title", this.generateRelativeSelector($, titleEl), "text");
    }

    // Description
    const descEl = sample.find("p, .description, .profileDescription, .bio").first();
    if (descEl.length) {
      addRule("description", this.generateRelativeSelector($, descEl), "text");
    }

    // Image — prefer <img src>, fallback to background-image
    const imgEl = sample.find("img[src]").first();
    if (imgEl.length) {
      addRule("image", this.generateRelativeSelector($, imgEl), "src");
    } else {
      const bgEl = sample.find("[style*='background-image']").first();
      if (bgEl.length) {
        addRule("image", this.generateRelativeSelector($, bgEl), "style");
      }
    }

    // Link
    const linkEl = sample.find("a[href]").first();
    if (linkEl.length) {
      addRule("link", this.generateRelativeSelector($, linkEl), "href");
    }

    // Searchable text / generic text
    const textEl = sample.find(".searchable").first()
      || sample.find("span").first();
    if (textEl && textEl.length) {
      addRule("text", this.generateRelativeSelector($, textEl), "text");
    }

    return rules.slice(0, 10);
  }

  /**
   * Fallback for pages with no detected repeating container.
   * Builds flat rules from the whole document.
   * Uses multiple: true so extractSingle collects all matching values.
   */
  private buildFlatRules($: cheerio.CheerioAPI): ExtractionRule[] {
    const rules: ExtractionRule[] = [];
    const usedFields = new Set<string>();

    const addRule = (
      fieldName: string,
      selector: string,
      attribute: ExtractionRule["attribute"],
    ) => {
      if (!selector || usedFields.has(fieldName)) return;
      usedFields.add(fieldName);
      rules.push({ fieldName, selector, attribute, multiple: true });
    };

    if ($("h1, h2, h3").length) addRule("title", "h1, h2, h3", "text");
    if ($("p").length) addRule("description", "p", "text");
    if ($("img[src]").length) addRule("image", "img", "src");
    if ($("a[href]").length) addRule("link", "a[href]", "href");

    return rules;
  }
}