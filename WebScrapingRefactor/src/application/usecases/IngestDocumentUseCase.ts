import { ICleaner } from "../../domain/ports/ICleaner";
import { IParser } from "../../domain/ports/IParser";
import { IngestDocumentUseCaseRequest } from "../dto/IngestDocumentUseCaseRequest";
import { Document } from "../../domain/entities/Document";
import { TenantId } from "../../domain/value-objects/TenantId";
import { FilePath } from "../../domain/value-objects/FilePath";
import { Url } from "../../domain/value-objects/Url";
import { IngestDocumentUseCaseResponse } from '../dto/IngestDocumentUsecaseResponse';


export class IngestDocumentUseCase {
  constructor(private parser: IParser, private cleaner: ICleaner) {}

  async execute(request: IngestDocumentUseCaseRequest): Promise<IngestDocumentUseCaseResponse> {
    const sourceUrl = new Url(request.url);

    const raw = await this.parser.parse(sourceUrl.toString());
    const markdown = await this.cleaner.clean(raw);

    const document = new Document(
      request.id,
      new TenantId(request.tenantId),
      new FilePath(request.filePath),
      sourceUrl,
      markdown
    );

    return { document };
  }
}
