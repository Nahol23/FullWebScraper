export class TenantId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("TenantId cannot be empty");
    }
    this.value = value.trim();
  }

  public getValue(): string {
    return this.value;
  }
}
