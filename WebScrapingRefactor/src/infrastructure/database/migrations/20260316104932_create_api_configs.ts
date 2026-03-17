import type { Kysely } from 'kysely'

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
	.createTable('api_configs')
	.addColumn('id', 'text', (col) => col.primaryKey().notNull())
	.addColumn('name', 'text', (col) => col.notNull())
	.addColumn('base_url', 'text', (col) => col.notNull())
	.addColumn('endpoint', 'text', (col)=> col.notNull())
	.addColumn('method','text', (col)=> col.notNull())
	.addColumn('query_params_json', 'text')
	.addColumn('headers', 'text')
	.addColumn('body_json', 'text')
    .addColumn('data_path', 'text')
    .addColumn('pagination_json', 'text')
    .addColumn('filter_json', 'text')
    .addColumn('selected_fields_json', 'text')
    .execute()
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('api_configs').execute()
	
}
