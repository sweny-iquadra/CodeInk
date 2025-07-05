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
  categoryId: integer("category_id").references(() => categories.id),
  parentLayoutId: integer("parent_layout_id").references(() => generatedLayouts.id),
  versionNumber: text("version_number").default("1.0").notNull(),
  changesDescription: text("changes_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#8b5cf6"),
  description: text("description"),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6b7280"),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const layoutTags = pgTable("layout_tags", {
  id: serial("id").primaryKey(),
  layoutId: integer("layout_id").references(() => generatedLayouts.id).notNull(),
  tagId: integer("tag_id").references(() => tags.id).notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("member"), // 'admin', 'editor', 'viewer', 'member'
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const sharedLayouts = pgTable("shared_layouts", {
  id: serial("id").primaryKey(),
  layoutId: integer("layout_id").references(() => generatedLayouts.id).notNull(),
  sharedWithUserId: integer("shared_with_user_id").references(() => users.id),
  sharedWithTeamId: integer("shared_with_team_id").references(() => teams.id),
  permissions: text("permissions").notNull().default("view"), // 'view', 'edit', 'admin'
  sharedBy: integer("shared_by").references(() => users.id).notNull(),
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
});

export const layoutComments = pgTable("layout_comments", {
  id: serial("id").primaryKey(),
  layoutId: integer("layout_id").references(() => generatedLayouts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  comment: text("comment").notNull(),
  positionX: integer("position_x"),
  positionY: integer("position_y"),
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  layouts: many(generatedLayouts),
  categories: many(categories),
  tags: many(tags),
  createdTeams: many(teams),
  teamMemberships: many(teamMembers),
  sharedLayouts: many(sharedLayouts),
  layoutComments: many(layoutComments),
}));

export const layoutsRelations = relations(generatedLayouts, ({ one, many }) => ({
  user: one(users, {
    fields: [generatedLayouts.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [generatedLayouts.categoryId],
    references: [categories.id],
  }),
  parentLayout: one(generatedLayouts, {
    fields: [generatedLayouts.parentLayoutId],
    references: [generatedLayouts.id],
  }),
  childVersions: many(generatedLayouts),
  layoutTags: many(layoutTags),
  sharedLayouts: many(sharedLayouts),
  comments: many(layoutComments),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  layouts: many(generatedLayouts),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  layoutTags: many(layoutTags),
}));

export const layoutTagsRelations = relations(layoutTags, ({ one }) => ({
  layout: one(generatedLayouts, {
    fields: [layoutTags.layoutId],
    references: [generatedLayouts.id],
  }),
  tag: one(tags, {
    fields: [layoutTags.tagId],
    references: [tags.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  creator: one(users, {
    fields: [teams.createdBy],
    references: [users.id],
  }),
  members: many(teamMembers),
  sharedLayouts: many(sharedLayouts),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const sharedLayoutsRelations = relations(sharedLayouts, ({ one }) => ({
  layout: one(generatedLayouts, {
    fields: [sharedLayouts.layoutId],
    references: [generatedLayouts.id],
  }),
  sharedWithUser: one(users, {
    fields: [sharedLayouts.sharedWithUserId],
    references: [users.id],
  }),
  sharedWithTeam: one(teams, {
    fields: [sharedLayouts.sharedWithTeamId],
    references: [teams.id],
  }),
  sharedBy: one(users, {
    fields: [sharedLayouts.sharedBy],
    references: [users.id],
  }),
}));

export const layoutCommentsRelations = relations(layoutComments, ({ one }) => ({
  layout: one(generatedLayouts, {
    fields: [layoutComments.layoutId],
    references: [generatedLayouts.id],
  }),
  user: one(users, {
    fields: [layoutComments.userId],
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

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});

export const insertLayoutTagSchema = createInsertSchema(layoutTags).omit({
  id: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertSharedLayoutSchema = createInsertSchema(sharedLayouts).omit({
  id: true,
  sharedAt: true,
});

export const insertLayoutCommentSchema = createInsertSchema(layoutComments).omit({
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

// Project Management Assistant schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  color: z.string().default("#8b5cf6"),
  description: z.string().optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().default("#6b7280"),
});

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
});

export const shareLayoutSchema = z.object({
  layoutId: z.number(),
  sharedWithUserId: z.number().optional(),
  sharedWithTeamId: z.number().optional(),
  permissions: z.enum(["view", "edit", "admin"]).default("view"),
});

export const addCommentSchema = z.object({
  layoutId: z.number(),
  comment: z.string().min(1, "Comment is required"),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

export const createVersionSchema = z.object({
  layoutId: z.number(),
  versionNumber: z.string(),
  changesDescription: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLayout = z.infer<typeof insertLayoutSchema>;
export type GeneratedLayout = typeof generatedLayouts.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertLayoutTag = z.infer<typeof insertLayoutTagSchema>;
export type LayoutTag = typeof layoutTags.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertSharedLayout = z.infer<typeof insertSharedLayoutSchema>;
export type SharedLayout = typeof sharedLayouts.$inferSelect;
export type InsertLayoutComment = z.infer<typeof insertLayoutCommentSchema>;
export type LayoutComment = typeof layoutComments.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type CreateCategoryRequest = z.infer<typeof createCategorySchema>;
export type CreateTagRequest = z.infer<typeof createTagSchema>;
export type CreateTeamRequest = z.infer<typeof createTeamSchema>;
export type ShareLayoutRequest = z.infer<typeof shareLayoutSchema>;
export type AddCommentRequest = z.infer<typeof addCommentSchema>;
export type CreateVersionRequest = z.infer<typeof createVersionSchema>;
