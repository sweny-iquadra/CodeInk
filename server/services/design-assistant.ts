import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DesignAssistantRequest {
  message: string;
  currentLayout?: string;
  conversationHistory?: Array<{ content: string; sender: 'user' | 'assistant' }>;
}

export interface DesignAssistantResponse {
  response: string;
  suggestions?: string[];
  actionType?: 'generate' | 'improve' | 'recommend' | null;
  actionData?: any;
}

export async function processDesignAssistantMessage(request: DesignAssistantRequest): Promise<DesignAssistantResponse> {
  const { message, currentLayout, conversationHistory = [] } = request;

  // Build conversation context
  const contextMessages = conversationHistory.slice(-5).map(msg => ({
    role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
    content: msg.content
  }));

  const systemPrompt = `Design assistant. Respond ONLY with valid JSON.

Format:
{
  "response": "helpful text",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "actionType": "generate",
  "actionData": {"description": "detailed layout description"}
}

Rules:
- Always return valid JSON
- Set actionType "generate" for layout requests
- Keep responses concise and helpful`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...contextMessages,
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 400,
    });

    let result;
    try {
      const content = response.choices[0].message.content || '{}';
      // Clean up potential JSON formatting issues
      const cleanContent = content.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Raw content:", response.choices[0].message.content);
      // Fallback to safe response
      result = {
        response: "I'm here to help you create amazing layouts! What would you like to build?",
        suggestions: ["Create a landing page", "Build a portfolio", "Design a dashboard"],
        actionType: undefined,
        actionData: undefined
      };
    }
    
    return {
      response: result.response || "I'm here to help you create amazing layouts! What would you like to build?",
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : ["Create a landing page", "Build a portfolio", "Design a dashboard"],
      actionType: result.actionType,
      actionData: result.actionData
    };

  } catch (error) {
    console.error("Error in design assistant:", error);
    // Return a safe fallback instead of throwing
    return {
      response: "I'm here to help you create amazing layouts! What would you like to build?",
      suggestions: ["Create a landing page", "Build a portfolio", "Design a dashboard"],
      actionType: undefined,
      actionData: undefined
    };
  }
}

export async function generateFrameworkRecommendation(requirements: string): Promise<{
  framework: string;
  reasoning: string;
  alternatives: Array<{ name: string; reason: string }>;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a CSS framework expert. Analyze project requirements and recommend the best framework.

Available frameworks:
- Tailwind CSS: Utility-first, highly customizable, modern
- Bootstrap: Component-based, rapid development, widely adopted
- Material Design: Google's design system, consistent UI, mobile-first

Respond with JSON:
{
  "framework": "tailwind|bootstrap|material-ui",
  "reasoning": "Detailed explanation of why this framework is best",
  "alternatives": [
    {"name": "framework_name", "reason": "Why this could also work"},
    {"name": "framework_name", "reason": "Another alternative"}
  ]
}`
        },
        {
          role: "user",
          content: `Project requirements: ${requirements}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 400,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("Error generating framework recommendation:", error);
    throw new Error("Failed to generate framework recommendation");
  }
}

export async function analyzeLayoutAndSuggestImprovements(htmlCode: string): Promise<{
  improvements: string[];
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Web design expert. Analyze layouts and suggest specific, actionable improvements.

Return JSON:
{
  "improvements": [
    "Add hover effects to interactive elements",
    "Improve color contrast for better accessibility", 
    "Enhance mobile responsive breakpoints",
    "Optimize typography hierarchy and spacing",
    "Include loading states and animations"
  ],
  "reasoning": "Brief analysis summary",
  "priority": "low|medium|high"
}

Focus on: layout structure, responsive design, accessibility, visual hierarchy, UX, performance.`
        },
        {
          role: "user",
          content: `Analyze this HTML layout and suggest improvements:\n\n${htmlCode.substring(0, 2000)}...`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 500,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("Error analyzing layout:", error);
    throw new Error("Failed to analyze layout");
  }
}