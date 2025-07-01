import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLayoutSchema } from "@shared/schema";
import multer from "multer";
import { generateCodeFromDescription, analyzeImageAndGenerateCode, explainCode, improveLayout } from "./services/openai";

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
  // Generate code from text description
  app.post("/api/generate-from-text", async (req, res) => {
    try {
      const { description, additionalContext } = req.body;
      
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }

      const result = await generateCodeFromDescription({
        description,
        additionalContext,
      });

      // Save to storage
      const layout = await storage.createLayout({
        title: result.title,
        description: result.description,
        inputMethod: "describe",
        generatedCode: result.html,
        additionalContext,
      });

      res.json({ ...result, id: layout.id });
    } catch (error) {
      console.error("Error generating code from text:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Generate code from uploaded image
  app.post("/api/generate-from-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const { additionalContext } = req.body;
      const imageBase64 = req.file.buffer.toString("base64");

      const result = await analyzeImageAndGenerateCode(imageBase64, additionalContext);

      // Save to storage
      const layout = await storage.createLayout({
        title: result.title,
        description: result.description,
        inputMethod: "upload",
        generatedCode: result.html,
        additionalContext,
      });

      res.json({ ...result, id: layout.id });
    } catch (error) {
      console.error("Error generating code from image:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get recent layouts
  app.get("/api/layouts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      const layouts = await storage.getLayouts(limit);
      res.json(layouts);
    } catch (error) {
      console.error("Error fetching layouts:", error);
      res.status(500).json({ message: error.message });
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
      res.status(500).json({ message: error.message });
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
      res.status(500).json({ message: error.message });
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
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
