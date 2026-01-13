import FirecrawlApp from "@mendable/firecrawl-js";
import { ICrawler } from "../../../domain/ports/Crawling/ICrawler";

export class FirecrawlCrawlerAdapter implements ICrawler {
  private app: FirecrawlApp;
  private readonly MAX_RETRIES = 3;

  constructor(apiKey: string) {
    this.app = new FirecrawlApp({ apiKey });
  }

  
   //Scrapes a single page with built-in retry logic.
   
  async scrape(url: string): Promise<{ url: string; markdown: string }> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(
          `[Firecrawl] Scraping ${url} (Attempt ${attempt}/${this.MAX_RETRIES})...`
        );
        const res = await this.app.scrape(url, {
          formats: ["markdown"],
          // Add a timeout if the library supports it or wrap in a Promise.race
        });

        if (!res.markdown || res.markdown.trim() === "") {
          throw new Error(`Empty markdown returned for ${url}`);
        }

        return { url, markdown: res.markdown };
      } catch (error) {
        lastError = error;
        console.warn(
          `[Firecrawl] Attempt ${attempt} failed: ${
            error instanceof Error ? error.message : error
          }`
        );
        if (attempt < this.MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }

    console.error(`[Firecrawl] All attempts failed for ${url}`);
    return { url, markdown: "" };
  }

  
   //Synchronous crawl with limit.
   
  async crawl(
    url: string,
    limit: number = 10
  ): Promise<{ url: string; markdown: string }[]> {
    try {
      console.log(
        `[Firecrawl] Starting synchronous crawl for ${url} (limit: ${limit})...`
      );
      const result = await this.app.crawl(url, { limit });

      return (result.data || [])
        .map((page: any) => {
          if (!page.markdown || page.markdown.trim() === "") {
            console.warn(`[Firecrawl] Skipping empty page: ${page.url}`);
            return null;
          }
          return {
            url: page.url,
            markdown: page.markdown,
          };
        })
        .filter(
          (item): item is { url: string; markdown: string } => item !== null
        );
    } catch (error) {
      console.error(`[Firecrawl] Crawl failed: ${error}`);
      return [];
    }
  }

  //Starts an asynchronous crawl job.
  async startCrawl(url: string, limit: number = 10): Promise<string> {
    console.log(`[Firecrawl] Initiating async crawl for ${url}...`);
    const job = await this.app.startCrawl(url, { limit });
    return job.id;
  }

  //Retrieves results of an asynchronous crawl job.
  async getCrawlStatus(
    crawlId: string
  ): Promise<{ url: string; markdown: string }[]> {
    console.log(`[Firecrawl] Checking status for job: ${crawlId}`);
    const status = await this.app.getCrawlStatus(crawlId);

    if (status.status !== "completed") {
      throw new Error(
        `Crawl not yet completed. Current status: ${status.status}`
      );
    }

    return (status.data || [])
      .map((page: any) => {
        if (!page.markdown || page.markdown.trim() === "") {
          return null;
        }
        return {
          url: page.url,
          markdown: page.markdown,
        };
      })
      .filter(
        (item): item is { url: string; markdown: string } => item !== null
      );
  }
}
