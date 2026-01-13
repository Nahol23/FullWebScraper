import { ICrawlStream } from "../../domain/ports/Crawling/ICrawlStream";

/**
 * Orchestratore per gestire il crawling in streaming via WebSocket.
 * Riceve eventi live (status, url, markdown) durante l'esecuzione.
 */
export class CrawlStreamWorkflow {
  constructor(private stream: ICrawlStream) {}

  async start(
    crawlId: string,
    onEvent: (event: {
      status: string;
      url?: string;
      markdown?: string;
    }) => void
  ) {
    // 1. Connetti al WebSocket
    await this.stream.connect(crawlId);

    // 2. Registra callback per ricevere aggiornamenti
    this.stream.onUpdate(onEvent);
  }

  stop() {
    // 3. Disconnetti quando non serve più
    this.stream.disconnect();
  }
}
