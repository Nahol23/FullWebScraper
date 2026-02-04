export interface ApiResponseDTO {
  data: unknown[];
  filteredBy?: { field: string; value: unknown };
  meta?: {
    paths: string[];
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    validObjectsCount?: number;
  };
}