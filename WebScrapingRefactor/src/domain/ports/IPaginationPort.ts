export interface IPaginationStrategy {
  getNextUrl(currentUrl: string): Promise<string | null>;
}