export interface Exhibitor {
  name: string;
  website?: string;
  description?: string;
}

export interface IExhibitorFetcher {
  fetch(category: string): Promise<Exhibitor[]>;
}
