import type { ExtractionRule } from "../entities/ScrapingConfig";

export class ScrapingDataNormalizer {
  normalize(
    pageData: unknown,
    rules: ExtractionRule[],
    containerSelector?: string
  ): Record<string, unknown>[] {
    if (!pageData) return [];

   
    if (containerSelector) {
      return this.isRecordArray(pageData) ? pageData : [];
    }

    if (rules.length === 0) return [];

    const hasMultiple = rules.some((r) => r.multiple);
    if (hasMultiple && this.isRecord(pageData)) {
      return this.normalizeParallelArrays(pageData, rules);
    }

    return this.isRecord(pageData) ? [pageData] : [];
  }

  private normalizeParallelArrays(
  pageData: Record<string, unknown>,
  rules: ExtractionRule[]
): Record<string, unknown>[] {
  // lunghezza dell'array più lungo invece del primo
  let maxLength = 0;
  for (const rule of rules) {
    if (rule.multiple) {
      const val = pageData[rule.fieldName];
      if (Array.isArray(val) && val.length > maxLength) {
        maxLength = val.length;
      }
    }
  }

  if (maxLength === 0) return [];

  const items: Record<string, unknown>[] = [];
  for (let i = 0; i < maxLength; i++) {
    const item: Record<string, unknown> = {};
    for (const rule of rules) {
      const value = pageData[rule.fieldName];
      item[rule.fieldName] =
        rule.multiple && Array.isArray(value) ? (value[i] ?? "") : (value ?? "");
    }
    items.push(item);
  }
  return items;
}

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private isRecordArray(value: unknown): value is Record<string, unknown>[] {
    return Array.isArray(value) && value.every(this.isRecord);
  }
}