import { users, generatedLayouts, type User, type InsertUser, type GeneratedLayout, type InsertLayout } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Layout management
  createLayout(layout: InsertLayout): Promise<GeneratedLayout>;
  getLayouts(limit?: number): Promise<GeneratedLayout[]>;
  getLayout(id: number): Promise<GeneratedLayout | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private layouts: Map<number, GeneratedLayout>;
  private currentUserId: number;
  private currentLayoutId: number;

  constructor() {
    this.users = new Map();
    this.layouts = new Map();
    this.currentUserId = 1;
    this.currentLayoutId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createLayout(insertLayout: InsertLayout): Promise<GeneratedLayout> {
    const id = this.currentLayoutId++;
    const layout: GeneratedLayout = {
      ...insertLayout,
      id,
      createdAt: new Date(),
    };
    this.layouts.set(id, layout);
    return layout;
  }

  async getLayouts(limit = 10): Promise<GeneratedLayout[]> {
    const layouts = Array.from(this.layouts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return layouts;
  }

  async getLayout(id: number): Promise<GeneratedLayout | undefined> {
    return this.layouts.get(id);
  }
}

export const storage = new MemStorage();
