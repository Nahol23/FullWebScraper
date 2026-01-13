import FirecrawlApp from "@mendable/firecrawl-js";
import { IParser } from "../../../domain/ports/IParser";

export class FirecrawlParserAdapter implements IParser {
  private app: FirecrawlApp;

  constructor(apiKey: string) {
    this.app = new FirecrawlApp({ apiKey });
  }

  async parse(url: string): Promise<string> {
    // Firecrawl restituisce direttamente un Document
    const result = await this.app.scrape(url, {
      formats: ["markdown", "links"], // puoi chiedere anche "html", "links"
    });

    if (!result.markdown) {
      throw new Error(`Firecrawl did not return markdown for ${url}`);
    }

    return result.markdown;
  }
}
