export interface ApiConfig {
    name : string;
    baseUrl: string;
    endpoint: string;
    method : "GET" | "POST";
    queryParams?: ApiParam[];
    dataPath?: string;
    body?: unknown;
    filter?: {field: string; value: unknown};
    selectedFields? : string[];
}

export interface ApiParam{
    key : string;
    value: string ;
    type: "string" | "number" | "boolean";
}