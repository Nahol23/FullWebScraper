export class DataPath {
  private readonly value: string;

  constructor(input: string | null | undefined) {
    this.value = input ?? "";
  }

  overrideWith(manual?: string): DataPath {
    if (manual && this.value === "") {
      return new DataPath(manual);
    }
    return this;
  }

  get raw(): string {
    return this.value;
  }
}
