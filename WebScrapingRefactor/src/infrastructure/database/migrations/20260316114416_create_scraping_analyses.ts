import  { Kysely, sql } from 'kysely'

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	 await db.schema
    .createTable('scraping_analyses')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('url', 'text', (col) => col.notNull())
    .addColumn('timestamp', 'text', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn('options_json', 'text')
    .addColumn('result_json', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull())
    .addColumn('error_message', 'text')
    .execute()
	
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('scraping_analyses').execute()
}
