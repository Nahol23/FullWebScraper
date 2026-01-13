import { TenantId } from "../value-objects/TenantId";
import { FilePath } from "../value-objects/FilePath";
import { Url } from "../value-objects/Url";

export class Document {
  constructor(
    public readonly id: string,
    public readonly tenantId: TenantId,
    public readonly filePath: FilePath,
    public readonly sourceUrl: Url,
    public readonly rawContent: string
  ) {}
}
