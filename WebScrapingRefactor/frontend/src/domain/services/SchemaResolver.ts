import type { Analysis } from "../../types/Analysis";
import { DataPath } from "../value-objects/DataPath";

export class SchemaResolver {
  resolve(
    schema: Analysis["discoveredSchema"] | undefined,
    manualPath?: string
  ) {
    if (!schema) {
      return {
        suggestedFields: [],
        params: [],
        dataPath: new DataPath("").overrideWith(manualPath).raw
      };
    }

    const normalized = new DataPath(schema.dataPath).overrideWith(manualPath);

    return {
      ...schema,
      dataPath: normalized.raw
    };
  }
}
