import type { IPaginationStrategy } from "../../ports/IPaginationPort";

export class UrlParamPaginationStrategy implements IPaginationStrategy {
  constructor(private readonly paramName: string) {}

  async getNextUrl(currentUrl: string): Promise<string | null> {
    try {
      const url = new URL(currentUrl);
      const currentPage = parseInt(url.searchParams.get(this.paramName) ?? "1", 10);
      url.searchParams.set(this.paramName, (currentPage + 1).toString());
      return url.toString();
    } catch {
      return null;
    }
  }
}