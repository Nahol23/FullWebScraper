export interface ICrawler {
  crawl(url: string, limit?: number): Promise<{ url: string; markdown: string }[]>;
  startCrawl(url: string, limit?: number): Promise<string>; // ritorna crawlId
  getCrawlStatus(crawlId: string): Promise<{ url: string; markdown: string }[]>;
  scrape(url: string): Promise<{ url: string; markdown: string }> ;

}
