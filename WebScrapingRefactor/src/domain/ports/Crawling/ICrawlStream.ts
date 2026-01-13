export interface ICrawlStream {
  connect(crawlId: string): Promise<void>;
  onUpdate(
    callback: (event: {
      status: string;
      url?: string;
      markdown?: string;
    }) => void
  ): void;
  disconnect(): void;
}
