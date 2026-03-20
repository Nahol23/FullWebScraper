import { ColumnType, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  scraping_configs: ScrapingConfigTable;
  api_configs: ApiConfigTable;
  analyses: AnalysisTable;
  scraping_analyses: ScrapingAnalysisTable;
  scraping_executions: ScrapingExecutionTable;
  executions: ExecutionTable;
}

export interface ScrapingConfigTable {
  id: string;
  name: string;
  base_url: string;
  method: string | null;

  headers_json: string | null;
  body_json: string | null;
  rules_json: string;
  pagination_json: string | null;
  default_runtime_params_json: string | null;

  wait_for_selector: string | null;
  container_selector: string | null;
  data_path: string | null;

  // Inseribile come stringa ISO o undefined (usa DEFAULT CURRENT_TIMESTAMP)
  // Mai aggiornabile direttamente
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string | null, string | undefined, string | null>;
}

export type ScrapingConfigRow = Selectable<ScrapingConfigTable>;
export type NewScrapingConfig = Insertable<ScrapingConfigTable>;
export type ScrapingConfigUpdate = Updateable<ScrapingConfigTable>;

export interface ApiConfigTable {
  id: string;
  name: string;
  base_url: string;
  endpoint: string;
  method: string;

  query_params_json: string | null;
  headers: string | null;
  body_json: string | null;
  data_path: string | null;
  pagination_json: string | null;
  filter_json: string | null;
  selected_fields_json: string | null;
}

export type ApiConfigRow = Selectable<ApiConfigTable>;
export type NewApiConfig = Insertable<ApiConfigTable>;
export type ApiConfigUpdate = Updateable<ApiConfigTable>;

export interface AnalysisTable {
  id: string;
  url: string;
  method: string;
  body_json: string | null;
  headers_json: string | null;
  status: string;
  discovered_schema_json: string | null;

  created_at: ColumnType<string, string | undefined, never>;
}

export type AnalysisRow = Selectable<AnalysisTable>;
export type NewAnalysis = Insertable<AnalysisTable>;
export type AnalysisUpdate = Updateable<AnalysisTable>;

export interface ScrapingAnalysisTable {
  id: string;
  url: string;
  timestamp: ColumnType<string, string | undefined, never>;

  options_json: string | null;
  result_json: string;
  status: string;
  error_message: string | null;
}

export type ScrapingAnalysisRow = Selectable<ScrapingAnalysisTable>;
export type NewScrapingAnalysis = Insertable<ScrapingAnalysisTable>;
export type ScrapingAnalysisUpdate = Updateable<ScrapingAnalysisTable>;

export interface ScrapingExecutionTable {
  id: string;
  config_id: string;
  timestamp: ColumnType<string, string | undefined, never>;
  url: string;

  rules_used_json: string;
  result_json: string;

  result_count: number;
  status: string;
  error_message: string | null;
  duration: number | null;
  next_page_url: string | null;
  pages_scraped: number;
}

export type ScrapingExecutionRow = Selectable<ScrapingExecutionTable>;
export type NewScrapingExecution = Insertable<ScrapingExecutionTable>;
export type ScrapingExecutionUpdate = Updateable<ScrapingExecutionTable>;

export interface ExecutionTable {
  id: string;
  config_id: string;
  timestamp: ColumnType<string, string | undefined, never>;

  parameters_used_json: string;

  result_count: number;
  status: string;
  error_message: string | null;
  next_page_url: string | null;
  pages_scraped: number;
}

export type ExecutionRow = Selectable<ExecutionTable>;
export type NewExecution = Insertable<ExecutionTable>;
export type ExecutionUpdate = Updateable<ExecutionTable>;
