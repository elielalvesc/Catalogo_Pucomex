// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const products=sqliteTable('products',{id:text('id').primaryKey(),body:text('body').notNull(),updatedAt:text('updated_at').notNull()});
export const batches=sqliteTable('batches',{id:text('id').primaryKey(),body:text('body').notNull(),updatedAt:text('updated_at').notNull()});
