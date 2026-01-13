//import { ICrawler } from "@/domain/ports/Crawling/ICrawler";
import { ICrawler } from "../../../domain/ports/Crawling/ICrawler";

export class StartCrawlUseCase {
  constructor(private crawler: ICrawler) {}

  async execute(url: string, limit: number = 10): Promise<string> {
    return await this.crawler.startCrawl(url, limit);
  }
}
