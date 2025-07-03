import { users, generatedLayouts, type User, type InsertUser, type GeneratedLayout, type InsertLayout } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User management
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Layout management
  createLayout(layout: InsertLayout): Promise<GeneratedLayout>;
  getLayouts(limit?: number): Promise<GeneratedLayout[]>;
  getUserLayouts(userId: number, limit?: number): Promise<GeneratedLayout[]>;
  getPublicLayouts(limit?: number): Promise<GeneratedLayout[]>;
  getLayout(id: number): Promise<GeneratedLayout | undefined>;
  updateLayoutVisibility(id: number, isPublic: boolean, userId: number): Promise<GeneratedLayout | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User management methods
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Layout management methods
  async createLayout(insertLayout: InsertLayout): Promise<GeneratedLayout> {
    const [layout] = await db
      .insert(generatedLayouts)
      .values({
        ...insertLayout,
        description: insertLayout.description || null,
        additionalContext: insertLayout.additionalContext || null,
      })
      .returning();
    return layout;
  }

  async getLayouts(limit = 10): Promise<GeneratedLayout[]> {
    const layouts = await db
      .select()
      .from(generatedLayouts)
      .orderBy(desc(generatedLayouts.createdAt))
      .limit(limit);
    return layouts;
  }

  async getUserLayouts(userId: number, limit = 10): Promise<GeneratedLayout[]> {
    const layouts = await db
      .select()
      .from(generatedLayouts)
      .where(eq(generatedLayouts.userId, userId))
      .orderBy(desc(generatedLayouts.createdAt))
      .limit(limit);
    return layouts;
  }

  async getPublicLayouts(limit = 10): Promise<GeneratedLayout[]> {
    const layouts = await db
      .select()
      .from(generatedLayouts)
      .where(eq(generatedLayouts.isPublic, true))
      .orderBy(desc(generatedLayouts.createdAt))
      .limit(limit);
    return layouts;
  }

  async getLayout(id: number): Promise<GeneratedLayout | undefined> {
    const [layout] = await db.select().from(generatedLayouts).where(eq(generatedLayouts.id, id));
    return layout || undefined;
  }

  async updateLayoutVisibility(id: number, isPublic: boolean, userId: number): Promise<GeneratedLayout | undefined> {
    const [layout] = await db
      .update(generatedLayouts)
      .set({ isPublic })
      .where(eq(generatedLayouts.id, id))
      .returning();
    return layout || undefined;
  }
}

export const storage = new DatabaseStorage();