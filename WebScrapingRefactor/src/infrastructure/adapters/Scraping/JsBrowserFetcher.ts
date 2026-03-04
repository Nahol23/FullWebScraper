import type { IBrowserPort } from "../../../domain/ports/IBrowserPort";

export interface JsBrowserFetchOptions {
  url: string;
  waitForSelector?: string;
}

//fa fetc pagine che richiedono rendering js 
// non consoce il browser

export class JsBrowserFetcher {
  constructor(private readonly browser: IBrowserPort) {}

  async fetch(options: JsBrowserFetchOptions): Promise<string> {
    return this.browser.fetchRenderedHtml(options.url, options.waitForSelector);
  }
}