import {Database}  from "./types"
import {Kysely, SqliteDialect} from 'kysely'
import SQLite from "better-sqlite3"
import path from "path"


function resolveDatabasePath(): string {
  const env = process.env['NODE_ENV'] ?? 'development'
 
  if (env === 'test') {
    return ':memory:'
  }
 
  const fileName = env === 'production' ? 'prod.db' : 'dev.db'
  return path.resolve(process.cwd(), 'data', fileName)
}

const dialect = new SqliteDialect({
  database: new SQLite(resolveDatabasePath())
  
})

export const db = new Kysely<Database>({
  dialect
})


