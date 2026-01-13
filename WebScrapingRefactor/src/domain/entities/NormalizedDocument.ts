import { Document } from "./Document";

export class NormalizedDocument {
  constructor(
    public readonly source: Document,
    public readonly cleanedText: string
  ) {}
}
