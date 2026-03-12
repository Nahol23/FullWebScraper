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
    const firstMultipleField = rules.find((r) => r.multiple)?.fieldName;
    if (!firstMultipleField) return [];

    const firstArray = pageData[firstMultipleField];
    if (!Array.isArray(firstArray)) return [];

    return firstArray.map((_, i) => {
      const item: Record<string, unknown> = {};
      for (const rule of rules) {
        const value = pageData[rule.fieldName];
        item[rule.fieldName] =
          rule.multiple && Array.isArray(value) ? value[i] : value;
      }
      return item;
    });
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private isRecordArray(value: unknown): value is Record<string, unknown>[] {
    return Array.isArray(value) && value.every(this.isRecord);
  }
}