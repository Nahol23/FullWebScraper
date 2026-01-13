import fs from "fs";
import path from "path";

export interface ApiConfig {
  name: string;
  baseUrl: string;
  endpoint: string;
  method: "GET" | "POST";
  defaultLimit?: number;
  supportsPagination?: boolean;
  paginationField?: string; 
  dataPath?: string;
  body?: any;
  filter?: {
    field: string;
    value: any;
  };
  selectedFields?: string[];
}

export function loadApiConfig(apiName: string): ApiConfig | null {
  // Cerca sia in src (sviluppo) che nella root (produzione)
  const locations = [
    path.join(process.cwd(), "src", "config", `${apiName}.json`),
    path.join(process.cwd(), "config", `${apiName}.json`)
  ];

  for (const configPath of locations) {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(raw);
    }
  }
  return null;
}

export function saveApiConfig(config: ApiConfig) {
  const configPath = path.join(process.cwd(), "src", "config", `${config.name}.json`);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  console.log(`Configurazione aggiornata in ${configPath}`);
}
