import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("executions")
    .addColumn("next_page_url", "text")
    .execute();

  await db.schema
    .alterTable("executions")
    .addColumn("pages_scraped", "integer", (col) => col.notNull().defaultTo(0))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("executions")
    .dropColumn("next_page_url")
    .execute();
  await db.schema
    .alterTable("executions")
    .dropColumn("pages_scraped")
    .execute();
}
