export class FilePath {
  private readonly value: string;

  constructor(value: string) {
    if (!value || !value.includes("/")) {
      throw new Error("Invalid file path");
    }
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}
