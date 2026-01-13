import { IExhibitorFetcher } from "../../domain/ports/Mido/IExhibitorFetcher";

export class FetchExhibitorsUseCase {
  constructor(private readonly fetcher: IExhibitorFetcher) {}

  async execute(category: string): Promise<string> {
    const exhibitors = await this.fetcher.fetch(category);

    const markdown = [
      "| Nome | Sito Web | Descrizione |",
      "|------|-----------|-------------|",
      ...exhibitors.map(
        (e) => `| ${e.name} | ${e.website ?? "-"} | ${e.description ?? "-"} |`
      ),
    ].join("\n");

    return markdown;
  }
}
