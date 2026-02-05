export class RequestBody {
  private readonly value: unknown;

  constructor(input: unknown) {
    this.value = input ?? {};
  }

  asJson(): unknown {
    return this.value;
  }

  isEmpty(): boolean {
    return this.value === null || this.value === undefined;
  }
}
