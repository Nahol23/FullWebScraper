export class ExecutionOverridesVO {
  private readonly value: Record<string, unknown>;

  constructor(input?: Record<string, unknown>) {
    const limit = input?.limit;
    if (limit !== undefined && typeof limit === "number" && limit <= 0) {
      throw new Error("Il limite deve essere un numero positivo");
    }

    this.value = input ?? {};
  }

  get raw(): Record<string, unknown> {
    return this.value;
  }
}
