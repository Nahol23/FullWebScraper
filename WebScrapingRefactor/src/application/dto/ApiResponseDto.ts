export interface ApiResponseDTO {
  data: Record<string, any>[];
  filteredBy?: { field: string; value: any };

  meta? :{
    paths: string[];
    total? : number;
    page?: number;     
    limit?: number;    
    hasNext?: boolean; // if more data exists
  }
}
