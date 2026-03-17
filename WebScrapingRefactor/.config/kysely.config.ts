import { defineConfig, getKnexTimestampPrefix } from "kysely-ctl"
import { db } from "../src/infrastructure/database/database"

export default defineConfig({
  kysely: db,
  migrations: {
    migrationFolder: "../src/infrastructure/database/migrations",
    getMigrationPrefix: getKnexTimestampPrefix,
  },
})