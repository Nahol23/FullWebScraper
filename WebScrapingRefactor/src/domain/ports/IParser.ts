export interface IParser {
  parse(url: string): Promise<string>;
}
