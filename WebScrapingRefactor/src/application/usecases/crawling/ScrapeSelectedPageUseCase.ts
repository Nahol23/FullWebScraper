import { CleanMarkdownUseCase } from './../CleanMarkdownUseCase';
import { PageDTO } from "../../dto/PageDto";
import { ICrawler } from "../../../domain/ports/Crawling/ICrawler";
import { ILanguageDetector } from "../../../domain/ports/ILanguageDetector"


export class ScrapeSelectedPagesUseCase {
  constructor(
    private crawler: ICrawler,
    private detector: ILanguageDetector,
    private cleaner: CleanMarkdownUseCase
  ) {}

  async execute(
    urls: string[],
    language: "it" | "en",
    filterByLanguage: boolean = true
  ): Promise<PageDTO[]> {
    const results: PageDTO[] = [];

    for (const url of urls) {
      const page = await this.crawler.scrape(url);
      const detected = this.detector.detect(page.markdown);

      // Se filterByLanguage è true, applica il filtro
      if (!filterByLanguage || detected === language) {
        const cleaned = await this.cleaner.execute(page.markdown);

        results.push({
          url,
          markdown: cleaned,
          language: detected,
        });
      }
    }

    return results;
  }
}
