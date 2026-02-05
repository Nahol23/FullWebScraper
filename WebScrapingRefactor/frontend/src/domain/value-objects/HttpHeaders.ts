export class HttpHeaders {
  private readonly headers: Record<string, string>;

  constructor(input?: Record<string, unknown>) {
    this.headers = Object.fromEntries(
      Object.entries(input ?? {}).map(([k, v]) => [k, String(v)])
    );
  }

  get raw(): Record<string, string> {
    return this.headers;
  }
}
