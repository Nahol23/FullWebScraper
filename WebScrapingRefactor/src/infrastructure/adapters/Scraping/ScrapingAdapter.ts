import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import type { ExtractionRule } from "../../../domain/entities/ScrapingConfig";

export interface FetchHtmlOptions {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: any;
  useJavaScript?: boolean;
  waitForSelector?: string;
}
export interface ScrapeOptions {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: any;
  waitForSelector?: string;
  rules: ExtractionRule[];
  useJavaScript?: boolean;
  containerSelector?: string;
}
export class ScrapingAdapter {
  async scrape(options: ScrapeOptions): Promise<Record<string, any>> {
    const html = await this.fetchHtml({
      url: options.url,
      method: options.method,
      headers: options.headers,
      body: options.body,
      waitForSelector: options.waitForSelector,
      useJavaScript: options.useJavaScript,
    });
    return this.extractWithRules(html, options.rules);
  }
  private urlEncode(obj: Record<string, any>): string {
    return Object.entries(obj)
      .map(
        ([key, val]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`,
      )
      .join("&");
  }

  async fetchHtml(options: FetchHtmlOptions): Promise<string> {
    const {
      url,
      method = "GET",
      headers = {},
      body,
      useJavaScript,
      waitForSelector,
    } = options;

    // Se è richiesto JavaScript o un waitForSelector, usa Puppeteer
    if (useJavaScript || waitForSelector) {
      return this.fetchWithPuppeteer(url, waitForSelector);
    }

    // Fetch standard con Node.js fetch
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        ...headers,
      },
    };

    if (body) {
      const contentType = headers["Content-Type"] || "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        fetchOptions.body = this.urlEncode(body);
      } else if (typeof body === "object") {
        fetchOptions.body = JSON.stringify(body);
        // Se non è già presente, aggiungi Content-Type: application/json
        if (!contentType.includes("application/json")) {
          fetchOptions.headers = {
            ...fetchOptions.headers,
            "Content-Type": "application/json",
          };
        }
      } else {
        fetchOptions.body = body;
      }
    }

    const res = await fetch(url, fetchOptions);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    return res.text();
  }

  private async fetchWithPuppeteer(
    url: string,
    waitForSelector?: string,
  ): Promise<string> {
    const browser = await puppeteer.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle2" });
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      }
      return await page.content();
    } finally {
      await browser.close();
    }
  }

  extractWithRules(
    html: string,
    rules: ExtractionRule[],
    containerSelector?: string,
  ): any {
    const $ = cheerio.load(html);
    if (containerSelector) {
      const items: any[] = [];
      $(containerSelector).each((_, container) => {
        const item: any = {};
        for (const rule of rules) {
          // Cerca all'interno del container
          const $el = $(container).find(rule.selector).first();
          if (rule.multiple) {
            item[rule.fieldName] = $(container)
              .find(rule.selector)
              .map((_, el) => this.extractValue($(el), rule.attribute))
              .get();
          } else {
            item[rule.fieldName] = this.extractValue($el, rule.attribute);
          }
        }
        items.push(item);
      });
      return items;
    } else {
      // Comportamento originale (singolo oggetto con array)
      const result: any = {};
      for (const rule of rules) {
        const elements = $(rule.selector);
        if (rule.multiple) {
          result[rule.fieldName] = elements
            .map((_, el) => this.extractValue($(el), rule.attribute))
            .get();
        } else {
          result[rule.fieldName] = this.extractValue(
            elements.first(),
            rule.attribute,
          );
        }
      }
      return result;
    }
  }

  private extractValue($el: cheerio.Cheerio<any>, attribute?: string): string {
    if (attribute === "html") return $el.html()?.trim() || "";
    if (attribute === "href") return $el.attr("href")?.trim() || "";
    if (attribute === "src") return $el.attr("src")?.trim() || "";
    if (attribute === "innerText") return $el.text().trim();
    if (attribute === "style") {
      const style = $el.attr("style") || "";
      const match = style.match(/url\(["']?(.*?)["']?\)/);
      return match ? match[1] : "";
    }
    return $el.text().trim();
  }
}
