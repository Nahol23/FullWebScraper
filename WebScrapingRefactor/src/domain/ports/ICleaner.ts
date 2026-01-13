export interface ICleaner {
  clean(raw: string): Promise<string>;
}
