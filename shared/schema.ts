import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const generatedLayouts = pgTable("generated_layouts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  inputMethod: text("input_method").notNull(), // 'upload' or 'describe'
  generatedCode: text("generated_code").notNull(),
  additionalContext: text("additional_context"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertLayoutSchema = createInsertSchema(generatedLayouts).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLayout = z.infer<typeof insertLayoutSchema>;
export type GeneratedLayout = typeof generatedLayouts.$inferSelect;
