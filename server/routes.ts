import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLayoutSchema, loginSchema, registerSchema } from "@shared/schema";
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
      const { description, additionalContext, isPublic } = req.body;

      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }

      const result = await generateCodeFromDescription({
        description,
        additionalContext,
      });

      // Save to storage with user association
      const layout = await storage.createLayout({
        title: result.title,
        description: result.description,
        inputMethod: "describe",
        generatedCode: result.html,
        additionalContext,
        userId: req.user!.userId,
        isPublic: Boolean(isPublic),
      });

      res.json({ ...result, id: layout.id });
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

      const { additionalContext, isPublic } = req.body;
      const imageBase64 = req.file.buffer.toString("base64");

      const result = await analyzeImageAndGenerateCode(imageBase64, additionalContext);

      // Save to storage with user association
      const layout = await storage.createLayout({
        title: result.title,
        description: result.description,
        inputMethod: "upload",
        generatedCode: result.html,
        additionalContext,
        userId: req.user!.userId,
        isPublic: Boolean(isPublic === 'true'),
      });

      res.json({ ...result, id: layout.id });
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
  app.post("/api/improve-layout", async (req, res) => {
    try {
      const { code, feedback } = req.body;

      if (!code) {
        return res.status(400).json({ message: "Code is required" });
      }

      const result = await improveLayout(code, feedback);

      // Save improved layout to storage
      const layout = await storage.createLayout({
        title: `Improved: ${result.title}`,
        description: result.description,
        inputMethod: "describe",
        generatedCode: result.html,
        additionalContext: feedback,
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

  const httpServer = createServer(app);
  return httpServer;
}