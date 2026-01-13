export class Chunk {
  constructor(
    public readonly documentId: string,
    public readonly index: number,
    public readonly text: string,
    public readonly embedding?: number[]
  ) {}
}
