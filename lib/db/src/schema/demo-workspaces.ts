import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const demoWorkspaces = pgTable("demo_workspaces", {
  id: text("id").primaryKey(),
  state: jsonb("state").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDemoWorkspaceSchema = createInsertSchema(demoWorkspaces);
export type DemoWorkspaceRow = typeof demoWorkspaces.$inferSelect;
