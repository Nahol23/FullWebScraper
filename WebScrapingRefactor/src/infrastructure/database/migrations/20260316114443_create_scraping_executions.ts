import  { Kysely, sql } from 'kysely'

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	  await db.schema
    .createTable('scraping_executions')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('config_id', 'text', (col) =>
      col.references('scraping_configs.id').onDelete('cascade').notNull(),
    )
    .addColumn('timestamp', 'text', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn('url', 'text', (col) => col.notNull())
    .addColumn('rules_used_json', 'text', (col) => col.notNull())
    .addColumn('result_json', 'text', (col) => col.notNull())
    .addColumn('result_count', 'integer', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull())
    .addColumn('error_message', 'text')
    .addColumn('duration', 'integer')
    .execute()
	
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('scraping_executions').execute()
}
