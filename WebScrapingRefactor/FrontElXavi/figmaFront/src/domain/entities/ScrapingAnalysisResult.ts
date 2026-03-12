export interface ScrapingAnalysisResponse {
  url: string;
  title: string;
  suggestedRules: Array<{
    fieldName: string;
    selector: string;
    attribute?: string;
    multiple?: boolean;
    transform?: string;
  }>;
  sampleData: any;
  detectedListSelectors: string[];
  rawPreview?: string;
}