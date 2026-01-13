import { ICrawlStream } from "../../../domain/ports/Crawling/ICrawlStream";
import { WebSocket } from "ws";

export class FirecrawlWebSocketAdapter implements ICrawlStream {
  private ws?: WebSocket;
  private callbacks: ((event: {
    status: string;
    url?: string;
    markdown?: string;
  }) => void)[] = [];

  async connect(crawlId: string): Promise<void> {
    this.ws = new WebSocket(`wss://api.firecrawl.dev/crawl/${crawlId}`);

    this.ws.on("message", (data: string) => {
      const event = JSON.parse(data);
      this.callbacks.forEach((cb) => cb(event));
    });

    this.ws.on("open", () => console.log(" WebSocket connected:", crawlId));
    this.ws.on("close", () => console.log(" WebSocket disconnected"));
  }

  onUpdate(
    callback: (event: {
      status: string;
      url?: string;
      markdown?: string;
    }) => void
  ): void {
    this.callbacks.push(callback);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }
}
