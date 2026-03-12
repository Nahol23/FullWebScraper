export interface IBrowserPort {
  fetchRenderedHtml(url: string, waitForSelector?: string): Promise<string>;
  close(): Promise<void>;
}