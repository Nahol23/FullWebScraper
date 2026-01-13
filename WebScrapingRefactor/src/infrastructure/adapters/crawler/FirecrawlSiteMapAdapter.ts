import FirecrawlApp from "@mendable/firecrawl-js";
import { ISiteMapper } from "../../../domain/ports/Crawling/ISiteMapper";

export class FirecrawlSiteMapAdapter implements ISiteMapper {
  private app: FirecrawlApp;

  constructor(apiKey: string) {
    this.app = new FirecrawlApp({ apiKey });
  }

  async map(url: string, limit: number = 10): Promise<string[]> {
    const res = await this.app.map(url, { limit, sitemap: "include" });
    return res.links.map((link: { url: string }) => link.url);
  }
}
