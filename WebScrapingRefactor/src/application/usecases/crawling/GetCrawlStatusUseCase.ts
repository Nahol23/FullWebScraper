import { ICrawler } from '../../../domain/ports/Crawling/ICrawler';

export class GetCrawlStatusUseCase {
  constructor(private crawler: ICrawler) {}

  async execute(crawlId: string): Promise<{ url: string; markdown: string }[]> {
    return await this.crawler.getCrawlStatus(crawlId);
  }
}
