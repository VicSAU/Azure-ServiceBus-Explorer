import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const connections = sqliteTable('connections', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    connectionString: text('connectionString').notNull(),
    createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
    updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;
