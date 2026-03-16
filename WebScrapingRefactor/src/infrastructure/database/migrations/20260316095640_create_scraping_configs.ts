import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('scraping_configs')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('base_url', 'text', (col) => col.notNull())
    .addColumn('method', 'text')
    .addColumn('headers_json', 'text')
    .addColumn('body_json', 'text')
    .addColumn('rules_json', 'text', (col) => col.notNull())
    .addColumn('pagination_json', 'text')
    .addColumn('default_runtime_params_json', 'text')
    .addColumn('wait_for_selector', 'text')
    .addColumn('container_selector', 'text')
    .addColumn('data_path', 'text')
    .addColumn('created_at', 'text', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn('updated_at', 'text')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('scraping_configs').execute()
}