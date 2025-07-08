import { 
  users, 
  generatedLayouts, 
  categories,
  tags,
  layoutTags,
  teams,
  teamMembers,
  teamInvitations,
  sharedLayouts,
  layoutComments,
  type User, 
  type InsertUser, 
  type GeneratedLayout, 
  type InsertLayout,
  type Category,
  type InsertCategory,
  type Tag,
  type InsertTag,
  type LayoutTag,
  type InsertLayoutTag,
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type TeamInvitation,
  type InsertTeamInvitation,
  type SharedLayout,
  type InsertSharedLayout,
  type LayoutComment,
  type InsertLayoutComment
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, inArray, isNotNull } from "drizzle-orm";

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
  checkLayoutNameExists(userId: number, name: string): Promise<boolean>;
  
  // Category management
  createCategory(category: InsertCategory): Promise<Category>;
  getUserCategories(userId: number): Promise<Category[]>;
  updateCategory(id: number, category: Partial<InsertCategory>, userId: number): Promise<Category | undefined>;
  deleteCategory(id: number, userId: number): Promise<boolean>;
  getLayoutsByCategory(categoryId: number, userId: number): Promise<GeneratedLayout[]>;
  
  // Tag management
  createTag(tag: InsertTag): Promise<Tag>;
  getUserTags(userId: number): Promise<Tag[]>;
  updateTag(id: number, tag: Partial<InsertTag>, userId: number): Promise<Tag | undefined>;
  deleteTag(id: number, userId: number): Promise<boolean>;
  addTagToLayout(layoutId: number, tagId: number): Promise<LayoutTag>;
  removeTagFromLayout(layoutId: number, tagId: number): Promise<boolean>;
  getLayoutTags(layoutId: number): Promise<Tag[]>;
  
  // Version control
  createLayoutVersion(parentId: number, layout: InsertLayout): Promise<GeneratedLayout>;
  getLayoutVersions(parentId: number): Promise<GeneratedLayout[]>;
  getLayoutVersionHistory(layoutId: number): Promise<GeneratedLayout[]>;
  
  // Team management
  createTeam(team: InsertTeam): Promise<Team>;
  getUserTeams(userId: number): Promise<Team[]>;
  addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: number): Promise<boolean>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  getTeamMemberCount(teamId: number): Promise<number>;
  updateTeamMemberRole(teamId: number, userId: number, role: string): Promise<TeamMember | undefined>;
  
  // Team invitations
  createTeamInvitation(invitation: InsertTeamInvitation): Promise<TeamInvitation>;
  getUserInvitations(userId: number): Promise<TeamInvitation[]>;
  getUserAcceptedInvitations(userId: number): Promise<TeamInvitation[]>;
  respondToInvitation(invitationId: number, status: string, userId: number): Promise<TeamInvitation | undefined>;
  getTeamInvitations(teamId: number): Promise<TeamInvitation[]>;
  getAllUsers(): Promise<User[]>; // For user search during invitations
  
  // Sharing and collaboration
  shareLayout(share: InsertSharedLayout): Promise<SharedLayout>;
  getSharedLayouts(userId: number): Promise<SharedLayout[]>;
  updateSharePermissions(shareId: number, permissions: string, userId: number): Promise<SharedLayout | undefined>;
  removeLayoutShare(shareId: number, userId: number): Promise<boolean>;
  
  // Comments
  addComment(comment: InsertLayoutComment): Promise<LayoutComment>;
  getLayoutComments(layoutId: number): Promise<LayoutComment[]>;
  resolveComment(commentId: number, userId: number): Promise<LayoutComment | undefined>;
  deleteComment(commentId: number, userId: number): Promise<boolean>;
  
  // Search and filtering
  searchLayouts(userId: number, query: string, filters?: {
    categoryId?: number;
    tagIds?: number[];
    isPublic?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<GeneratedLayout[]>;
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
      .select({
        id: generatedLayouts.id,
        title: generatedLayouts.title,
        description: generatedLayouts.description,
        inputMethod: generatedLayouts.inputMethod,
        generatedCode: generatedLayouts.generatedCode,
        additionalContext: generatedLayouts.additionalContext,
        userId: generatedLayouts.userId,
        isPublic: generatedLayouts.isPublic,
        categoryId: generatedLayouts.categoryId,
        parentLayoutId: generatedLayouts.parentLayoutId,
        versionNumber: generatedLayouts.versionNumber,
        changesDescription: generatedLayouts.changesDescription,
        createdAt: generatedLayouts.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
        }
      })
      .from(generatedLayouts)
      .leftJoin(categories, eq(generatedLayouts.categoryId, categories.id))
      .where(eq(generatedLayouts.userId, userId))
      .orderBy(desc(generatedLayouts.createdAt))
      .limit(limit);
    return layouts as any;
  }

  async getPublicLayouts(limit = 10): Promise<GeneratedLayout[]> {
    const layouts = await db
      .select({
        id: generatedLayouts.id,
        title: generatedLayouts.title,
        description: generatedLayouts.description,
        inputMethod: generatedLayouts.inputMethod,
        generatedCode: generatedLayouts.generatedCode,
        additionalContext: generatedLayouts.additionalContext,
        userId: generatedLayouts.userId,
        isPublic: generatedLayouts.isPublic,
        categoryId: generatedLayouts.categoryId,
        parentLayoutId: generatedLayouts.parentLayoutId,
        versionNumber: generatedLayouts.versionNumber,
        changesDescription: generatedLayouts.changesDescription,
        createdAt: generatedLayouts.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
        }
      })
      .from(generatedLayouts)
      .leftJoin(categories, eq(generatedLayouts.categoryId, categories.id))
      .where(eq(generatedLayouts.isPublic, true))
      .orderBy(desc(generatedLayouts.createdAt))
      .limit(limit);
    return layouts as any;
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

  async checkLayoutNameExists(userId: number, name: string): Promise<boolean> {
    const [layout] = await db
      .select({ id: generatedLayouts.id })
      .from(generatedLayouts)
      .where(and(
        eq(generatedLayouts.userId, userId),
        eq(generatedLayouts.title, name)
      ))
      .limit(1);
    return !!layout;
  }

  // Category management methods
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async getUserCategories(userId: number): Promise<Category[]> {
    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.name);
    return userCategories;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>, userId: number): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return updatedCategory || undefined;
  }

  async deleteCategory(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return result.rowCount > 0;
  }

  async getLayoutsByCategory(categoryId: number, userId: number): Promise<GeneratedLayout[]> {
    const layouts = await db
      .select({
        id: generatedLayouts.id,
        title: generatedLayouts.title,
        description: generatedLayouts.description,
        inputMethod: generatedLayouts.inputMethod,
        generatedCode: generatedLayouts.generatedCode,
        additionalContext: generatedLayouts.additionalContext,
        userId: generatedLayouts.userId,
        isPublic: generatedLayouts.isPublic,
        categoryId: generatedLayouts.categoryId,
        parentLayoutId: generatedLayouts.parentLayoutId,
        versionNumber: generatedLayouts.versionNumber,
        changesDescription: generatedLayouts.changesDescription,
        createdAt: generatedLayouts.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
        }
      })
      .from(generatedLayouts)
      .leftJoin(categories, eq(generatedLayouts.categoryId, categories.id))
      .where(and(eq(generatedLayouts.categoryId, categoryId), eq(generatedLayouts.userId, userId)))
      .orderBy(desc(generatedLayouts.createdAt));
    return layouts as any;
  }

  // Tag management methods
  async createTag(insertTag: InsertTag): Promise<Tag> {
    const [tag] = await db
      .insert(tags)
      .values(insertTag)
      .returning();
    return tag;
  }

  async getUserTags(userId: number): Promise<Tag[]> {
    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId))
      .orderBy(tags.name);
    return userTags;
  }

  async updateTag(id: number, tag: Partial<InsertTag>, userId: number): Promise<Tag | undefined> {
    const [updatedTag] = await db
      .update(tags)
      .set(tag)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .returning();
    return updatedTag || undefined;
  }

  async deleteTag(id: number, userId: number): Promise<boolean> {
    // First verify the tag exists and belongs to the user
    const existingTag = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .limit(1);
    
    if (existingTag.length === 0) {
      return false; // Tag not found or not owned by user
    }
    
    // Remove all layout-tag associations for this tag
    await db
      .delete(layoutTags)
      .where(eq(layoutTags.tagId, id));
    
    // Then delete the tag itself
    await db
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)));
    
    return true; // Success since we verified it exists before deletion
  }

  async addTagToLayout(layoutId: number, tagId: number): Promise<LayoutTag> {
    const [layoutTag] = await db
      .insert(layoutTags)
      .values({ layoutId, tagId })
      .returning();
    return layoutTag;
  }

  async removeTagFromLayout(layoutId: number, tagId: number): Promise<boolean> {
    // First, check if the tag relationship exists
    const existingRelation = await db
      .select()
      .from(layoutTags)
      .where(and(eq(layoutTags.layoutId, layoutId), eq(layoutTags.tagId, tagId)));
    
    console.log(`Checking for layoutTag relation: layoutId=${layoutId}, tagId=${tagId}`, existingRelation);
    
    if (existingRelation.length === 0) {
      console.log("No layoutTag relation found to delete");
      return false;
    }
    
    const result = await db
      .delete(layoutTags)
      .where(and(eq(layoutTags.layoutId, layoutId), eq(layoutTags.tagId, tagId)));
    
    console.log(`Delete result:`, result);
    
    // Check if the relation was actually deleted by checking if it still exists
    const remainingRelation = await db
      .select()
      .from(layoutTags)
      .where(and(eq(layoutTags.layoutId, layoutId), eq(layoutTags.tagId, tagId)));
    
    const success = remainingRelation.length === 0;
    console.log(`Tag removal success: ${success}`);
    return success;
  }

  async getLayoutTags(layoutId: number): Promise<Tag[]> {
    const layoutTagsData = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        userId: tags.userId,
        createdAt: tags.createdAt,
      })
      .from(layoutTags)
      .innerJoin(tags, eq(layoutTags.tagId, tags.id))
      .where(eq(layoutTags.layoutId, layoutId));
    return layoutTagsData;
  }

  // Version control methods
  async createLayoutVersion(parentId: number, layout: InsertLayout): Promise<GeneratedLayout> {
    const [version] = await db
      .insert(generatedLayouts)
      .values({
        ...layout,
        parentLayoutId: parentId,
        description: layout.description || null,
        additionalContext: layout.additionalContext || null,
      })
      .returning();
    return version;
  }

  async getLayoutVersions(parentId: number): Promise<GeneratedLayout[]> {
    const versions = await db
      .select()
      .from(generatedLayouts)
      .where(eq(generatedLayouts.parentLayoutId, parentId))
      .orderBy(desc(generatedLayouts.createdAt));
    return versions;
  }

  async getLayoutVersionHistory(layoutId: number): Promise<GeneratedLayout[]> {
    // Get the layout and all its versions
    const layout = await this.getLayout(layoutId);
    if (!layout) return [];

    const parentId = layout.parentLayoutId || layoutId;
    const allVersions = await db
      .select()
      .from(generatedLayouts)
      .where(or(eq(generatedLayouts.id, parentId), eq(generatedLayouts.parentLayoutId, parentId)))
      .orderBy(asc(generatedLayouts.createdAt)); // Changed to ascending order to show v1.0 first, then v1.1
    
    console.log(`getLayoutVersionHistory for layout ${layoutId}, parentId ${parentId}, found versions:`, 
      allVersions.map(v => `ID ${v.id} ${v.versionNumber}`));
    return allVersions;
  }

  // Team management methods
  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values(insertTeam)
      .returning();
    
    // Automatically add the creator as an admin member
    await db
      .insert(teamMembers)
      .values({
        teamId: team.id,
        userId: team.createdBy,
        role: "admin"
      });
    
    return team;
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    // Get teams where user is the creator OR is a member
    const createdTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.createdBy, userId))
      .orderBy(teams.name);
    
    const memberTeams = await db
      .select({ teams: teams })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId))
      .orderBy(teams.name);
    
    // Combine and deduplicate
    const allTeams = [...createdTeams, ...memberTeams.map(result => result.teams)];
    const uniqueTeams = allTeams.filter((team, index, self) => 
      index === self.findIndex((t) => t.id === team.id)
    );
    
    return uniqueTeams;
  }

  async addTeamMember(insertTeamMember: InsertTeamMember): Promise<TeamMember> {
    const [teamMember] = await db
      .insert(teamMembers)
      .values(insertTeamMember)
      .returning();
    return teamMember;
  }

  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    return result.rowCount > 0;
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(teamMembers.joinedAt);
    return members;
  }

  async getTeamMemberCount(teamId: number): Promise<number> {
    const result = await db
      .select({ count: teamMembers.id })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
    return result.length;
  }

  async updateTeamMemberRole(teamId: number, userId: number, role: string): Promise<TeamMember | undefined> {
    const [member] = await db
      .update(teamMembers)
      .set({ role })
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .returning();
    return member || undefined;
  }

  // Team invitation methods
  async createTeamInvitation(insertInvitation: InsertTeamInvitation): Promise<TeamInvitation> {
    const [invitation] = await db
      .insert(teamInvitations)
      .values(insertInvitation)
      .returning();
    return invitation;
  }

  async getUserInvitations(userId: number): Promise<TeamInvitation[]> {
    const invitations = await db
      .select({
        id: teamInvitations.id,
        teamId: teamInvitations.teamId,
        invitedUserId: teamInvitations.invitedUserId,
        invitedBy: teamInvitations.invitedBy,
        role: teamInvitations.role,
        status: teamInvitations.status,
        layoutId: teamInvitations.layoutId,
        message: teamInvitations.message,
        createdAt: teamInvitations.createdAt,
        respondedAt: teamInvitations.respondedAt,
        inviterUsername: users.username,
        layoutTitle: generatedLayouts.title,
        teamName: teams.name
      })
      .from(teamInvitations)
      .leftJoin(users, eq(teamInvitations.invitedBy, users.id))
      .leftJoin(generatedLayouts, eq(teamInvitations.layoutId, generatedLayouts.id))
      .leftJoin(teams, eq(teamInvitations.teamId, teams.id))
      .where(and(eq(teamInvitations.invitedUserId, userId), eq(teamInvitations.status, "pending")))
      .orderBy(desc(teamInvitations.createdAt));
    return invitations as TeamInvitation[];
  }

  async getUserAcceptedInvitations(userId: number): Promise<TeamInvitation[]> {
    const acceptedInvitations = await db
      .select({
        id: teamInvitations.id,
        teamId: teamInvitations.teamId,
        invitedUserId: teamInvitations.invitedUserId,
        invitedBy: teamInvitations.invitedBy,
        role: teamInvitations.role,
        status: teamInvitations.status,
        layoutId: teamInvitations.layoutId,
        message: teamInvitations.message,
        createdAt: teamInvitations.createdAt,
        respondedAt: teamInvitations.respondedAt,
        inviterUsername: users.username,
        layoutTitle: generatedLayouts.title,
        teamName: teams.name
      })
      .from(teamInvitations)
      .leftJoin(users, eq(teamInvitations.invitedBy, users.id))
      .leftJoin(generatedLayouts, eq(teamInvitations.layoutId, generatedLayouts.id))
      .leftJoin(teams, eq(teamInvitations.teamId, teams.id))
      .where(and(
        eq(teamInvitations.invitedUserId, userId), 
        eq(teamInvitations.status, "accepted"),
        isNotNull(teamInvitations.layoutId) // Only invitations with layout assignments
      ))
      .orderBy(desc(teamInvitations.respondedAt));
    return acceptedInvitations as TeamInvitation[];
  }

  async respondToInvitation(invitationId: number, status: string, userId: number): Promise<TeamInvitation | undefined> {
    const [invitation] = await db
      .update(teamInvitations)
      .set({ 
        status, 
        respondedAt: new Date() 
      })
      .where(and(eq(teamInvitations.id, invitationId), eq(teamInvitations.invitedUserId, userId)))
      .returning();
    
    // If accepted, add user to team
    if (status === "accepted" && invitation) {
      await this.addTeamMember({
        teamId: invitation.teamId,
        userId: invitation.invitedUserId,
        role: invitation.role
      });
    }
    
    return invitation || undefined;
  }

  async getTeamInvitations(teamId: number): Promise<TeamInvitation[]> {
    const invitations = await db
      .select()
      .from(teamInvitations)
      .where(eq(teamInvitations.teamId, teamId))
      .orderBy(desc(teamInvitations.createdAt));
    return invitations;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(users.username);
    return allUsers;
  }

  // Sharing and collaboration methods
  async shareLayout(insertShare: InsertSharedLayout): Promise<SharedLayout> {
    const [share] = await db
      .insert(sharedLayouts)
      .values(insertShare)
      .returning();
    return share;
  }

  async getSharedLayouts(userId: number): Promise<SharedLayout[]> {
    // Validate userId to prevent NaN errors
    if (!userId || isNaN(userId) || userId <= 0) {
      console.error("Invalid userId provided to getSharedLayouts:", userId);
      return [];
    }
    
    const shared = await db
      .select()
      .from(sharedLayouts)
      .where(eq(sharedLayouts.sharedWithUserId, userId))
      .orderBy(desc(sharedLayouts.sharedAt));
    return shared;
  }

  async updateSharePermissions(shareId: number, permissions: string, userId: number): Promise<SharedLayout | undefined> {
    const [share] = await db
      .update(sharedLayouts)
      .set({ permissions })
      .where(and(eq(sharedLayouts.id, shareId), eq(sharedLayouts.sharedBy, userId)))
      .returning();
    return share || undefined;
  }

  async removeLayoutShare(shareId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(sharedLayouts)
      .where(and(eq(sharedLayouts.id, shareId), eq(sharedLayouts.sharedBy, userId)));
    return result.rowCount > 0;
  }

  // Comment methods
  async addComment(insertComment: InsertLayoutComment): Promise<LayoutComment> {
    const [comment] = await db
      .insert(layoutComments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async getLayoutComments(layoutId: number): Promise<LayoutComment[]> {
    const comments = await db
      .select()
      .from(layoutComments)
      .where(eq(layoutComments.layoutId, layoutId))
      .orderBy(layoutComments.createdAt);
    return comments;
  }

  async resolveComment(commentId: number, userId: number): Promise<LayoutComment | undefined> {
    const [comment] = await db
      .update(layoutComments)
      .set({ resolved: true })
      .where(eq(layoutComments.id, commentId))
      .returning();
    return comment || undefined;
  }

  async deleteComment(commentId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(layoutComments)
      .where(and(eq(layoutComments.id, commentId), eq(layoutComments.userId, userId)));
    return result.rowCount > 0;
  }

  // Search and filtering methods
  async searchLayouts(userId: number, query: string, filters?: {
    categoryId?: number;
    tagIds?: number[];
    isPublic?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<GeneratedLayout[]> {
    console.log("searchLayouts called with userId:", userId, "type:", typeof userId);
    
    if (!userId || isNaN(userId)) {
      console.error("Invalid userId passed to searchLayouts:", userId);
      throw new Error("Invalid user ID");
    }
    
    let whereClause = eq(generatedLayouts.userId, userId);

    if (filters?.categoryId) {
      whereClause = and(whereClause, eq(generatedLayouts.categoryId, filters.categoryId));
    }

    if (filters?.isPublic !== undefined) {
      whereClause = and(whereClause, eq(generatedLayouts.isPublic, filters.isPublic));
    }

    if (filters?.dateFrom) {
      whereClause = and(whereClause, gte(generatedLayouts.createdAt, filters.dateFrom));
    }

    if (filters?.dateTo) {
      whereClause = and(whereClause, lte(generatedLayouts.createdAt, filters.dateTo));
    }

    // If query is provided, add text search
    if (query && query.trim()) {
      whereClause = and(whereClause, or(
        like(generatedLayouts.title, `%${query}%`),
        like(generatedLayouts.description, `%${query}%`)
      ));
    }

    const layouts = await db
      .select({
        id: generatedLayouts.id,
        title: generatedLayouts.title,
        description: generatedLayouts.description,
        inputMethod: generatedLayouts.inputMethod,
        generatedCode: generatedLayouts.generatedCode,
        additionalContext: generatedLayouts.additionalContext,
        userId: generatedLayouts.userId,
        isPublic: generatedLayouts.isPublic,
        categoryId: generatedLayouts.categoryId,
        parentLayoutId: generatedLayouts.parentLayoutId,
        versionNumber: generatedLayouts.versionNumber,
        changesDescription: generatedLayouts.changesDescription,
        createdAt: generatedLayouts.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
        }
      })
      .from(generatedLayouts)
      .leftJoin(categories, eq(generatedLayouts.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(generatedLayouts.createdAt));

    return layouts as any;
  }
}

export const storage = new DatabaseStorage();