import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertLayoutSchema, 
  loginSchema, 
  registerSchema,
  createCategorySchema,
  createTagSchema,
  createTeamSchema,
  shareLayoutSchema,
  addCommentSchema,
  createVersionSchema,
  inviteTeamMemberSchema,
  respondToInvitationSchema
} from "@shared/schema";
import multer from "multer";
import { generateCodeFromDescription, analyzeImageAndGenerateCode, explainCode, improveLayout } from "./services/openai";
import { processDesignAssistantMessage, generateFrameworkRecommendation, analyzeLayoutAndSuggestImprovements } from "./services/design-assistant";
import { authService } from "./services/auth";
import { authenticateToken, optionalAuth } from "./middleware/auth";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await authService.register(validatedData);
      res.status(201).json(result);
    } catch (error: unknown) {
      console.error("Registration error:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Registration failed"
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);
      res.json(result);
    } catch (error: unknown) {
      console.error("Login error:", error);
      res.status(401).json({
        message: error instanceof Error ? error.message : "Login failed"
      });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const user = await authService.getCurrentUser(token);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user });
    } catch (error: unknown) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to get user information" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const newToken = await authService.refreshToken(token);
      res.json({ token: newToken });
    } catch (error: unknown) {
      console.error("Token refresh error:", error);
      res.status(401).json({ message: "Invalid token" });
    }
  });

  // Generate code from text description (protected)
  app.post("/api/generate-from-text", authenticateToken, async (req, res) => {
    try {
      const { description, additionalContext, isPublic, categoryId, layoutName } = req.body;

      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }

      if (!layoutName) {
        return res.status(400).json({ message: "Layout name is required" });
      }

      // Check for duplicate layout name
      const nameExists = await storage.checkLayoutNameExists(req.user!.userId, layoutName);
      if (nameExists) {
        return res.status(400).json({ message: "A layout with this name already exists. Please choose a different name." });
      }

      const result = await generateCodeFromDescription({
        description,
        additionalContext,
      });

      // Save to storage with user association and custom name
      const layout = await storage.createLayout({
        title: layoutName, // Use the custom layout name instead of AI-generated title
        description: result.description,
        inputMethod: "describe",
        generatedCode: result.html,
        additionalContext,
        userId: req.user!.userId,
        isPublic: Boolean(isPublic),
        categoryId: categoryId ? parseInt(categoryId) : null,
        versionNumber: "v1.0",
        changesDescription: "Initial version created from text description"
      });

      res.json({ ...result, id: layout.id, title: layoutName });
    } catch (error: unknown) {
      console.error("Error generating code from text:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Generate code from uploaded image (protected)
  app.post("/api/generate-from-image", authenticateToken, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const { additionalContext, isPublic, categoryId, layoutName } = req.body;

      if (!layoutName) {
        return res.status(400).json({ message: "Layout name is required" });
      }

      // Check for duplicate layout name
      const nameExists = await storage.checkLayoutNameExists(req.user!.userId, layoutName);
      if (nameExists) {
        return res.status(400).json({ message: "A layout with this name already exists. Please choose a different name." });
      }

      const imageBase64 = req.file.buffer.toString("base64");

      const result = await analyzeImageAndGenerateCode(imageBase64, additionalContext);

      // Save to storage with user association and custom name
      const layout = await storage.createLayout({
        title: layoutName, // Use the custom layout name instead of AI-generated title
        description: result.description,
        inputMethod: "upload",
        generatedCode: result.html,
        additionalContext,
        userId: req.user!.userId,
        isPublic: Boolean(isPublic === 'true'),
        categoryId: categoryId ? parseInt(categoryId) : null,
        versionNumber: "v1.0",
        changesDescription: "Initial version created from uploaded image"
      });

      res.json({ ...result, id: layout.id, title: layoutName });
    } catch (error: unknown) {
      console.error("Error generating code from image:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get user's recent layouts (protected)
  app.get("/api/layouts", authenticateToken, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      const layouts = await storage.getUserLayouts(req.user!.userId, limit);
      res.json(layouts);
    } catch (error: unknown) {
      console.error("Error fetching layouts:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get all layouts accessible to user (own + team shared)
  app.get("/api/layouts/accessible", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.userId;
      
      // Get user's own layouts
      const ownLayouts = await storage.getUserLayouts(userId, 100);
      
      // Get user's teams
      const teams = await storage.getUserTeams(userId);
      
      // Get layouts shared with user's teams (from team invitations that were accepted)
      const accessibleLayouts = new Map();
      
      // Add own layouts
      ownLayouts.forEach(layout => {
        accessibleLayouts.set(layout.id, layout);
      });
      
      // Get team shared layouts through accepted invitations
      for (const team of teams) {
        const teamMembers = await storage.getTeamMembers(team.id);
        const userMember = teamMembers.find(member => member.userId === userId);
        
        if (userMember) {
          // User is a team member, get shared layouts for this team
          const sharedLayouts = await storage.getSharedLayouts(userId);
          sharedLayouts.forEach(share => {
            if (share.sharedWithTeamId === team.id) {
              // Fetch the actual layout
              storage.getLayout(share.layoutId).then(layout => {
                if (layout) {
                  accessibleLayouts.set(layout.id, layout);
                }
              });
            }
          });
        }
      }
      
      const resultLayouts = Array.from(accessibleLayouts.values());
      res.json(resultLayouts);
    } catch (error: unknown) {
      console.error("Error fetching accessible layouts:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get individual layout by ID (protected)
  app.get("/api/layouts/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const layout = await storage.getLayout(id);
      
      if (!layout) {
        return res.status(404).json({ message: "Layout not found" });
      }
      
      res.json(layout);
    } catch (error: unknown) {
      console.error("Error fetching layout:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get recent public layouts for gallery
  app.get("/api/public-layouts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const layouts = await storage.getPublicLayouts(limit);
      res.json(layouts);
    } catch (error: unknown) {
      console.error("Error fetching public layouts:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Update layout visibility (make public/private)
  app.patch("/api/layouts/:id/visibility", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isPublic } = req.body;

      if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ message: "isPublic must be a boolean" });
      }

      const layout = await storage.updateLayoutVisibility(id, isPublic, req.user!.userId);

      if (!layout) {
        return res.status(404).json({ message: "Layout not found" });
      }

      res.json(layout);
    } catch (error) {
      console.error("Error updating layout visibility:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get specific layout
  app.get("/api/layouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const layout = await storage.getLayout(id);

      if (!layout) {
        return res.status(404).json({ message: "Layout not found" });
      }

      res.json(layout);
    } catch (error) {
      console.error("Error fetching layout:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Explain code
  app.post("/api/explain-code", async (req, res) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ message: "Code is required" });
      }

      const explanation = await explainCode(code);
      res.json({ explanation });
    } catch (error) {
      console.error("Error explaining code:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Improve layout
  app.post("/api/improve-layout", authenticateToken, async (req, res) => {
    try {
      const { code, feedback, originalLayoutId } = req.body;

      console.log("Improve layout request:", { originalLayoutId, hasCode: !!code, feedback: feedback?.substring(0, 50) });

      if (!code) {
        return res.status(400).json({ message: "Code is required" });
      }

      const result = await improveLayout(code, feedback);

      // Always try to create a version if we have an original layout ID
      if (originalLayoutId && !isNaN(originalLayoutId)) {
        console.log(`Creating version for layout ID: ${originalLayoutId}`);
        // Get the original layout to determine the next version number
        const originalLayout = await storage.getLayout(originalLayoutId);
        if (originalLayout && originalLayout.userId === req.user!.userId) {
          // Get existing versions to determine next version number
          const versions = await storage.getLayoutVersions(originalLayoutId);
          const nextVersionNumber = `v1.${versions.length + 1}`;
          
          console.log(`Creating version ${nextVersionNumber} for layout: ${originalLayout.title}`);
          
          const versionLayout = await storage.createLayoutVersion(originalLayoutId, {
            title: originalLayout.title, // Keep the same title as original
            description: originalLayout.description, // Keep original description  
            inputMethod: "improve",
            generatedCode: result.html,
            additionalContext: feedback,
            userId: req.user!.userId,
            isPublic: originalLayout.isPublic,
            categoryId: originalLayout.categoryId,
            versionNumber: nextVersionNumber,
            changesDescription: `Improved layout: ${feedback || "AI-suggested enhancements"}`
          });
          
          console.log(`Version created with ID: ${versionLayout.id}, version: ${nextVersionNumber}`);
          return res.json({ 
            ...result, 
            id: versionLayout.id, 
            versionNumber: nextVersionNumber,
            title: originalLayout.title // Return original title 
          });
        } else {
          console.log(`Original layout not found or user doesn't own it: ${originalLayoutId}`);
        }
      } else {
        console.log(`No valid originalLayoutId provided: ${originalLayoutId}`);
      }

      // Create new layout if no original layout ID or user doesn't own it
      console.log("Creating new standalone improved layout");
      const layout = await storage.createLayout({
        title: `Improved: ${result.title}`,
        description: result.description,
        inputMethod: "improve",
        generatedCode: result.html,
        additionalContext: feedback,
        userId: req.user!.userId,
        isPublic: false,
        categoryId: null,
        versionNumber: "v1.0",
        changesDescription: "Initial version created from improvement"
      });

      res.json({ ...result, id: layout.id });
    } catch (error) {
      console.error("Error improving layout:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // AI Design Assistant Chatbot endpoints
  app.post("/api/design-assistant/chat", async (req, res) => {
    try {
      const { message, currentLayout, conversationHistory } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const result = await processDesignAssistantMessage({
        message,
        currentLayout,
        conversationHistory
      });

      res.json(result);
    } catch (error: unknown) {
      console.error("Error in design assistant chat:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/design-assistant/framework-recommendation", async (req, res) => {
    try {
      const { requirements } = req.body;

      if (!requirements) {
        return res.status(400).json({ message: "Requirements are required" });
      }

      const result = await generateFrameworkRecommendation(requirements);
      res.json(result);
    } catch (error: unknown) {
      console.error("Error generating framework recommendation:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/design-assistant/analyze-layout", async (req, res) => {
    try {
      const { htmlCode } = req.body;

      if (!htmlCode) {
        return res.status(400).json({ message: "HTML code is required" });
      }

      const result = await analyzeLayoutAndSuggestImprovements(htmlCode);
      res.json(result);
    } catch (error: unknown) {
      console.error("Error analyzing layout:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // ===== PROJECT MANAGEMENT ROUTES =====

  // Category management routes
  app.post("/api/categories", authenticateToken, async (req, res) => {
    try {
      const validatedData = createCategorySchema.parse(req.body);
      const category = await storage.createCategory({
        ...validatedData,
        userId: req.user!.userId,
      });
      res.status(201).json(category);
    } catch (error: unknown) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create category" });
    }
  });

  app.get("/api/categories", authenticateToken, async (req, res) => {
    try {
      const categories = await storage.getUserCategories(req.user!.userId);
      res.json(categories);
    } catch (error: unknown) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.put("/api/categories/:id", authenticateToken, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const validatedData = createCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(categoryId, validatedData, req.user!.userId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error: unknown) {
      console.error("Error updating category:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", authenticateToken, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const success = await storage.deleteCategory(categoryId, req.user!.userId);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).send();
    } catch (error: unknown) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Tag management routes
  app.post("/api/tags", authenticateToken, async (req, res) => {
    try {
      const validatedData = createTagSchema.parse(req.body);
      const tag = await storage.createTag({
        ...validatedData,
        userId: req.user!.userId,
      });
      res.status(201).json(tag);
    } catch (error: unknown) {
      console.error("Error creating tag:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create tag" });
    }
  });

  app.get("/api/tags", authenticateToken, async (req, res) => {
    try {
      const tags = await storage.getUserTags(req.user!.userId);
      res.json(tags);
    } catch (error: unknown) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.delete("/api/tags/:id", authenticateToken, async (req, res) => {
    try {
      const tagId = parseInt(req.params.id);
      console.log(`Attempting to delete tag ${tagId} for user ${req.user!.userId}`);
      
      if (isNaN(tagId)) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      
      const success = await storage.deleteTag(tagId, req.user!.userId);
      
      if (!success) {
        console.log(`Tag ${tagId} not found or not owned by user ${req.user!.userId}`);
        return res.status(404).json({ message: "Tag not found or you don't have permission to delete it" });
      }
      
      console.log(`Successfully deleted tag ${tagId}`);
      res.status(204).send();
    } catch (error: unknown) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  app.post("/api/layouts/:layoutId/tags/:tagId", authenticateToken, async (req, res) => {
    try {
      const layoutId = parseInt(req.params.layoutId);
      const tagId = parseInt(req.params.tagId);
      const layoutTag = await storage.addTagToLayout(layoutId, tagId);
      res.status(201).json(layoutTag);
    } catch (error: unknown) {
      console.error("Error adding tag to layout:", error);
      res.status(400).json({ message: "Failed to add tag to layout" });
    }
  });

  app.delete("/api/layouts/:layoutId/tags/:tagId", authenticateToken, async (req, res) => {
    try {
      const layoutId = parseInt(req.params.layoutId);
      const tagId = parseInt(req.params.tagId);
      
      if (isNaN(layoutId) || isNaN(tagId)) {
        return res.status(400).json({ message: "Invalid layout ID or tag ID" });
      }
      
      console.log("Removing tag from layout:", { layoutId, tagId });
      const success = await storage.removeTagFromLayout(layoutId, tagId);
      
      if (!success) {
        return res.status(404).json({ message: "Tag not found on layout" });
      }
      
      res.status(204).send();
    } catch (error: unknown) {
      console.error("Error removing tag from layout:", error);
      res.status(500).json({ message: "Failed to remove tag from layout" });
    }
  });

  app.get("/api/layouts/:layoutId/tags", async (req, res) => {
    try {
      const layoutId = parseInt(req.params.layoutId);
      
      if (isNaN(layoutId)) {
        return res.status(400).json({ message: "Invalid layout ID" });
      }
      
      console.log("Fetching tags for layout:", layoutId);
      const tags = await storage.getLayoutTags(layoutId);
      res.json(tags);
    } catch (error: unknown) {
      console.error("Error fetching layout tags:", error);
      res.status(500).json({ message: "Failed to fetch layout tags" });
    }
  });

  // Version control routes
  app.post("/api/layouts/:id/versions", authenticateToken, async (req, res) => {
    try {
      const parentId = parseInt(req.params.id);
      const { versionNumber, changesDescription } = req.body;
      
      // Get the original layout to copy its content
      const originalLayout = await storage.getLayout(parentId);
      if (!originalLayout) {
        return res.status(404).json({ message: "Original layout not found" });
      }
      
      const version = await storage.createLayoutVersion(parentId, {
        title: originalLayout.title,
        description: originalLayout.description,
        htmlCode: originalLayout.htmlCode,
        generatedCode: originalLayout.generatedCode || originalLayout.htmlCode,
        inputMethod: originalLayout.inputMethod || 'text',
        framework: originalLayout.framework || 'tailwind',
        versionNumber,
        changesDescription,
        userId: req.user!.userId,
        isPublic: originalLayout.isPublic
      });
      
      res.status(201).json(version);
    } catch (error: unknown) {
      console.error("Error creating layout version:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create version" });
    }
  });

  app.get("/api/layouts/:id/versions", authenticateToken, async (req, res) => {
    try {
      const layoutId = parseInt(req.params.id);
      const versions = await storage.getLayoutVersions(layoutId);
      res.json(versions);
    } catch (error: unknown) {
      console.error("Error fetching layout versions:", error);
      res.status(500).json({ message: "Failed to fetch versions" });
    }
  });

  app.get("/api/layouts/:id/history", authenticateToken, async (req, res) => {
    try {
      const layoutId = parseInt(req.params.id);
      if (isNaN(layoutId)) {
        return res.status(400).json({ message: "Invalid layout ID" });
      }
      
      const history = await storage.getLayoutVersionHistory(layoutId);
      res.json(history);
    } catch (error: unknown) {
      console.error("Error fetching layout history:", error);
      res.status(500).json({ message: "Failed to fetch layout history" });
    }
  });

  // Team management routes
  app.post("/api/teams", authenticateToken, async (req, res) => {
    try {
      const validatedData = createTeamSchema.parse(req.body);
      const team = await storage.createTeam({
        ...validatedData,
        createdBy: req.user!.userId,
      });
      res.status(201).json(team);
    } catch (error: unknown) {
      console.error("Error creating team:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create team" });
    }
  });

  app.get("/api/teams", authenticateToken, async (req, res) => {
    try {
      const teams = await storage.getUserTeams(req.user!.userId);
      // Add member count to each team
      const teamsWithCounts = await Promise.all(
        teams.map(async (team) => {
          const memberCount = await storage.getTeamMemberCount(team.id);
          return { ...team, memberCount };
        })
      );
      res.json(teamsWithCounts);
    } catch (error: unknown) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post("/api/teams/:teamId/members", authenticateToken, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { userId, role = "member" } = req.body;
      
      const teamMember = await storage.addTeamMember({
        teamId,
        userId,
        role,
      });
      
      res.status(201).json(teamMember);
    } catch (error: unknown) {
      console.error("Error adding team member:", error);
      res.status(400).json({ message: "Failed to add team member" });
    }
  });

  app.get("/api/teams/:teamId/members", authenticateToken, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error: unknown) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Team invitation routes
  app.get("/api/users", authenticateToken, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove password hash from response
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }));
      res.json(safeUsers);
    } catch (error: unknown) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Search users for autocomplete (for team invitations)
  app.get("/api/users/search", authenticateToken, async (req, res) => {
    try {
      const { q: query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.json([]);
      }

      const users = await storage.getAllUsers();
      const searchTerm = query.toLowerCase();
      
      // Filter users based on username or email containing the search term
      const filteredUsers = users
        .filter(user => 
          user.id !== req.user!.userId && // Exclude current user
          (user.username.toLowerCase().includes(searchTerm) || 
           user.email.toLowerCase().includes(searchTerm))
        )
        .slice(0, 5) // Limit to 5 results for performance
        .map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        }));

      res.json(filteredUsers);
    } catch (error: unknown) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.post("/api/teams/invite", authenticateToken, async (req, res) => {
    try {
      const validatedData = inviteTeamMemberSchema.parse(req.body);
      const invitation = await storage.createTeamInvitation({
        ...validatedData,
        invitedBy: req.user!.userId,
      });
      res.status(201).json(invitation);
    } catch (error: unknown) {
      console.error("Error creating team invitation:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create invitation" });
    }
  });

  app.get("/api/invitations", authenticateToken, async (req, res) => {
    try {
      const invitations = await storage.getUserInvitations(req.user!.userId);
      res.json(invitations);
    } catch (error: unknown) {
      console.error("Error fetching user invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.get("/api/accepted-invitations", authenticateToken, async (req, res) => {
    try {
      const acceptedInvitations = await storage.getUserAcceptedInvitations(req.user!.userId);
      res.json(acceptedInvitations);
    } catch (error: unknown) {
      console.error("Error fetching accepted invitations:", error);
      res.status(500).json({ message: "Failed to fetch accepted invitations" });
    }
  });

  app.post("/api/invitations/:id/respond", authenticateToken, async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      const { status } = respondToInvitationSchema.parse(req.body);
      
      const invitation = await storage.respondToInvitation(invitationId, status, req.user!.userId);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      res.json(invitation);
    } catch (error: unknown) {
      console.error("Error responding to invitation:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to respond to invitation" });
    }
  });

  app.get("/api/teams/:teamId/invitations", authenticateToken, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const invitations = await storage.getTeamInvitations(teamId);
      res.json(invitations);
    } catch (error: unknown) {
      console.error("Error fetching team invitations:", error);
      res.status(500).json({ message: "Failed to fetch team invitations" });
    }
  });

  // Sharing and collaboration routes
  app.post("/api/layouts/share", authenticateToken, async (req, res) => {
    try {
      const validatedData = shareLayoutSchema.parse(req.body);
      const share = await storage.shareLayout({
        ...validatedData,
        sharedBy: req.user!.userId,
      });
      res.status(201).json(share);
    } catch (error: unknown) {
      console.error("Error sharing layout:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to share layout" });
    }
  });

  app.get("/api/layouts/shared", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.userId || typeof req.user.userId !== 'number' || isNaN(req.user.userId)) {
        console.error("Invalid user ID for shared layouts:", req.user?.userId);
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const sharedLayouts = await storage.getSharedLayouts(req.user.userId);
      res.json(sharedLayouts);
    } catch (error: unknown) {
      console.error("Error fetching shared layouts:", error);
      res.status(500).json({ message: "Failed to fetch shared layouts" });
    }
  });

  // Get layouts by category
  app.get("/api/categories/:categoryId/layouts", authenticateToken, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      if (!req.user?.userId || typeof req.user.userId !== 'number') {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const layouts = await storage.getLayoutsByCategory(categoryId, req.user.userId);
      res.json(layouts);
    } catch (error: unknown) {
      console.error("Error fetching layouts by category:", error);
      res.status(500).json({ message: "Failed to fetch layouts by category" });
    }
  });

  // Comments routes
  app.post("/api/layouts/:layoutId/comments", authenticateToken, async (req, res) => {
    try {
      const layoutId = parseInt(req.params.layoutId);
      const validatedData = addCommentSchema.parse({ ...req.body, layoutId });
      
      const comment = await storage.addComment({
        ...validatedData,
        userId: req.user!.userId,
      });
      
      res.status(201).json(comment);
    } catch (error: unknown) {
      console.error("Error adding comment:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to add comment" });
    }
  });

  app.get("/api/layouts/:layoutId/comments", async (req, res) => {
    try {
      const layoutId = parseInt(req.params.layoutId);
      const comments = await storage.getLayoutComments(layoutId);
      res.json(comments);
    } catch (error: unknown) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.patch("/api/comments/:commentId/resolve", authenticateToken, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const comment = await storage.resolveComment(commentId, req.user!.userId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.json(comment);
    } catch (error: unknown) {
      console.error("Error resolving comment:", error);
      res.status(500).json({ message: "Failed to resolve comment" });
    }
  });

  // Search and filtering routes
  app.get("/api/layouts/search", authenticateToken, async (req, res) => {
    try {
      const { q: query, categoryId, tagIds, isPublic, dateFrom, dateTo } = req.query;
      
      const filters: any = {};
      
      // Handle categoryId with proper validation
      if (categoryId && categoryId !== "undefined" && categoryId !== "null" && categoryId !== "all") {
        const parsedCategoryId = parseInt(categoryId as string);
        if (!isNaN(parsedCategoryId)) {
          filters.categoryId = parsedCategoryId;
        }
      }
      
      // Handle tagIds array
      if (tagIds && tagIds !== "undefined" && tagIds !== "null") {
        const tagIdArray = (tagIds as string).split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        if (tagIdArray.length > 0) {
          filters.tagIds = tagIdArray;
        }
      }
      
      // Handle boolean isPublic flag
      if (isPublic !== undefined && isPublic !== "undefined") {
        filters.isPublic = isPublic === 'true';
      }
      
      // Handle date filters
      if (dateFrom && dateFrom !== "undefined" && dateFrom !== "") {
        filters.dateFrom = new Date(dateFrom as string);
      }
      if (dateTo && dateTo !== "undefined" && dateTo !== "") {
        filters.dateTo = new Date(dateTo as string);
      }
      
      if (!req.user?.userId || isNaN(req.user.userId)) {
        console.error("Invalid user ID:", req.user?.userId);
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      console.log("Search filters:", filters);
      console.log("User ID:", req.user.userId);
      
      const layouts = await storage.searchLayouts(req.user.userId, query as string || '', filters);
      res.json(layouts);
    } catch (error: unknown) {
      console.error("Error searching layouts:", error);
      res.status(500).json({ message: "Failed to search layouts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}