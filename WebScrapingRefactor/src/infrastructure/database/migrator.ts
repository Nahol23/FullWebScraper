/**
 * migrator.ts
 *
 * Esegue tutte le migrations pendenti tramite un MigrationProvider inline.
 * Le migrations sono importate staticamente, quindi funziona correttamente
 * sia in sviluppo che nel bundle SEA (Node.js Single Executable Application)
 * dove il filesystem virtuale non supporta fs.readdir di FileMigrationProvider.
 *
 * ## Non chiamare db.destroy() qui — il singleton db serve per tutta
 *    la vita del server. destroy() va chiamato solo nello graceful shutdown.
 */
import { Kysely, Migrator, MigrationProvider, Migration } from "kysely";
import { Database } from "./types";
import { allMigrations } from "./migrations/index";

class InlineMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return allMigrations;
  }
}

export async function runMigrations(db: Kysely<Database>): Promise<void> {
  const migrator = new Migrator({
    db,
    provider: new InlineMigrationProvider(),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("failed to migrate");
    console.error(error);
    throw error;
  }
}