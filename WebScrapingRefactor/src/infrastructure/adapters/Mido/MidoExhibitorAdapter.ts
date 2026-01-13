import axios from "axios";
import { IExhibitorFetcher } from "../../../domain/ports/Mido/IExhibitorFetcher";
import { Exhibitor } from "../../../domain/ports/Mido/IExhibitorFetcher";

export class MidoExhibitorAdapter implements IExhibitorFetcher {
  async fetch(category: string): Promise<Exhibitor[]> {
    const all: Exhibitor[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const url = `https://api.hubapi.com/cms/v3/hubdb/tables/847927518/rows?portalId=140962492&sort=name&limit=${limit}&categories__contains=${category}&offset=${offset}`;
      const res = await axios.get(url);
      const rows = res.data?.results ?? [];

      if (rows.length === 0) break;

      for (const row of rows) {
        all.push({
          name: row.values?.name,
          website: row.values?.website,
          description: row.values?.description,
        });
      }

      offset += limit;
    }

    return all;
  }
}
