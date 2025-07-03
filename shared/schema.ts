import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const generatedLayouts = pgTable("generated_layouts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  inputMethod: text("input_method").notNull(), // 'upload' or 'describe'
  generatedCode: text("generated_code").notNull(),
  additionalContext: text("additional_context"),
  userId: integer("user_id").references(() => users.id),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  layouts: many(generatedLayouts),
}));

export const layoutsRelations = relations(generatedLayouts, ({ one }) => ({
  user: one(users, {
    fields: [generatedLayouts.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  passwordHash: true,
});

export const insertLayoutSchema = createInsertSchema(generatedLayouts).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLayout = z.infer<typeof insertLayoutSchema>;
export type GeneratedLayout = typeof generatedLayouts.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
