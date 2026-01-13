import { ISiteMapper } from "../../../domain/ports/Crawling/ISiteMapper";
import { SiteMapDTO } from "../../dto/SiteMapDto";

export class GenerateSiteMapUseCase {
  constructor(private siteMapper: ISiteMapper) {}

  async execute(seedUrl: string, limit: number = 50): Promise<SiteMapDTO> {
    const urls = await this.siteMapper.map(seedUrl, limit);

    return {
      urls,
      seedUrl,
      limit,
    };
  }
}
