import * as m001 from "./20260316095640_create_scraping_configs";
import * as m002 from "./20260316104932_create_api_configs";
import * as m003 from "./20260316114354_create_analyses";
import * as m004 from "./20260316114416_create_scraping_analyses";
import * as m005 from "./20260316114443_create_scraping_executions";
import * as m006 from "./20260316114503_create_executions";
import * as m007 from "./20260319102932_add_pagination_columns";
import * as m008 from "./20260319104133_add_pagination_toExecutions";
import * as m009 from "./20260331121825_add_duration_column_toExecution";
import type { Migration } from "kysely";

export const allMigrations: Record<string, Migration> = {
  "20260316095640_create_scraping_configs": m001,
  "20260316104932_create_api_configs": m002,
  "20260316114354_create_analyses": m003,
  "20260316114416_create_scraping_analyses": m004,
  "20260316114443_create_scraping_executions": m005,
  "20260316114503_create_executions": m006,
  "20260319102932_add_pagination_columns": m007,
  "20260319104133_add_pagination_toExecutions": m008,
  "20260331121825_add_duration_column_toExecution": m009,
};
