import { Database } from "./types";
import { Kysely, SqliteDialect } from "kysely";
import SQLite from "better-sqlite3";
import path from "path";
import fs from "fs";
import os from "os"; 

function resolveDatabasePath(): string {
  const env = process.env["NODE_ENV"] ?? "development";

  if (env === "test") {
    return ":memory:";
  }

  const fileName = env === "production" ? "prod.db" : "dev.db";
  
  let baseDir: string;

  // Se l'app sta girando dentro l'eseguibile compilato (o forziamo la produzione)
  // Usiamo la cartella AppData di Windows o la Home del Mac/Linux
  if (process.env.NODE_ENV === "production" || process.execPath.includes("data-manager-backend")) {
    if (process.platform === 'win32') {
      baseDir = path.join(process.env.APPDATA || os.homedir(), 'data-manager', 'data');
    } else if (process.platform === 'darwin') {
      baseDir = path.join(os.homedir(), 'Library', 'Application Support', 'data-manager', 'data');
    } else {
      baseDir = path.join(os.homedir(), '.data-manager', 'data');
    }
  } else {
    // In fase di sviluppo, salviamo normalmente nella cartella del progetto
    baseDir = path.join(process.cwd(), "data");
  }

  const dbPath = path.resolve(baseDir, fileName);

  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });

  return dbPath;
}

const dialect = new SqliteDialect({
  database: new SQLite(resolveDatabasePath()),
});

export const db = new Kysely<Database>({
  dialect,
});