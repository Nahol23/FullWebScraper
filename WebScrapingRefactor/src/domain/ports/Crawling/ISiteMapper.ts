export interface ISiteMapper{
    map(url: string, limit?: number): Promise<string[]>;
}