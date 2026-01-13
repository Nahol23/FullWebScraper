export class Url {
  private readonly value: string;

  constructor(value: string) {
    try {
      new URL(value); 
    } catch {
      throw new Error("Invalid URL format");
    }
    this.value = value;
  }

  toString(): string {
    return this.value;
  }

  get domain(): string {
    return new URL(this.value).hostname;
  }

  get path(): string {
    return new URL(this.value).pathname;
  }
}
