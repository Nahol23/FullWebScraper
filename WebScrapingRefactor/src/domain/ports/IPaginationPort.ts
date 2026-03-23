export interface IPaginationStrategy {
  getNextUrl(currentUrl: string, html?: string): Promise<string | null>;
}