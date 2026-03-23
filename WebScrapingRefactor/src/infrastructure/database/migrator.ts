/**
 * migrator.ts
 *
 * Esegue tutte le migrations pendenti tramite il Migrator built-in di Kysely.
 * Viene chiamato all'avvio del server in main.ts.
 *
 * Segue il pattern dei docs ufficiali Kysely adattato per SQLite:
 *
 *   const migrator = new Migrator({ db, provider: new FileMigrationProvider(...) })
 *   const { error, results } = await migrator.migrateToLatest()
 *
 * Docs: "The migration methods use a lock on the database level and parallel
 *        calls are executed serially. This means that you can safely call
 *        migrateToLatest from multiple server instances simultaneously and
 *        the migrations are guaranteed to only be executed once."
 *
 * ⚠️  Non chiamare db.destroy() qui — il singleton db serve per tutta
 *     la vita del server. destroy() va chiamato solo nello graceful shutdown.
 */

import * as path from 'path'
import { promises as fs } from 'fs'
import { Kysely, Migrator, FileMigrationProvider } from 'kysely'
import { Database } from './types'
import { getAppRootDir } from '../utils/paths'

export async function runMigrations(db: Kysely<Database>): Promise<void> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(getAppRootDir(), 'migrations'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
      console.error(`failed to execute migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('failed to migrate')
    console.error(error)
    throw error
  }
}