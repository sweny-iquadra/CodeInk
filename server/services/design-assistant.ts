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
  actionType?: 'generate' | 'improve' | 'recommend';
  actionData?: any;
}

export async function processDesignAssistantMessage(request: DesignAssistantRequest): Promise<DesignAssistantResponse> {
  const { message, currentLayout, conversationHistory = [] } = request;

  // Build conversation context
  const contextMessages = conversationHistory.slice(-5).map(msg => ({
    role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
    content: msg.content
  }));

  const systemPrompt = `You are an expert AI Design Assistant for a web layout generation tool called Codink. Your role is to help users create beautiful, responsive web layouts through conversational interaction.

**Your Capabilities:**
1. **Interactive Layout Generation**: Help users describe layouts conversationally and generate specific requirements
2. **Real-time Design Feedback**: Analyze existing layouts and suggest improvements
3. **Framework Recommendations**: Suggest the best CSS framework (Tailwind, Bootstrap, Material Design) based on requirements

**Current Layout Context:** ${currentLayout ? 'User has a current layout loaded' : 'No current layout'}

**Response Format:** Always respond with JSON in this exact format:
{
  "response": "Your conversational response to the user",
  "suggestions": ["Quick suggestion 1", "Quick suggestion 2", "Quick suggestion 3"],
  "actionType": "generate|improve|recommend|none",
  "actionData": {
    // Include relevant data based on actionType
    "description": "Layout description for generation",
    "framework": "tailwind|bootstrap|material-ui",
    "additionalContext": "Any additional context",
    "feedback": "Improvement feedback"
  }
}

**Action Types:**
- **generate**: When user wants to create a new layout
- **improve**: When user wants to enhance existing layout  
- **recommend**: When user asks for framework or design advice
- **none**: For general conversation

**Interactive Layout Generation Examples:**
User: "I need a landing page for my restaurant"
→ actionType: "generate", ask follow-up questions about hero section, menu display, etc.

User: "Create a dashboard for analytics"  
→ actionType: "generate", gather requirements for charts, navigation, data types

**Real-time Design Feedback:**
When currentLayout exists, analyze it and suggest specific improvements like:
- Layout structure improvements
- Color scheme enhancements
- Typography suggestions
- Responsive design optimizations
- Accessibility improvements

**Framework Recommendations:**
- **Tailwind CSS**: Best for custom designs, flexibility, modern utilities
- **Bootstrap**: Best for rapid prototyping, team familiarity, enterprise
- **Material Design**: Best for consistent Google-style UI, mobile-first apps

Be enthusiastic and helpful! Focus on understanding user needs and providing valuable design guidance.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        ...contextMessages,
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      response: result.response || "I'm here to help you create amazing layouts! What would you like to build?",
      suggestions: result.suggestions || [],
      actionType: result.actionType,
      actionData: result.actionData
    };

  } catch (error) {
    console.error("Error in design assistant:", error);
    throw new Error("Failed to process design assistant request");
  }
}

export async function generateFrameworkRecommendation(requirements: string): Promise<{
  framework: string;
  reasoning: string;
  alternatives: Array<{ name: string; reason: string }>;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a web design expert. Analyze HTML layouts and suggest specific improvements.

Focus on:
- Layout structure and organization
- Responsive design
- Accessibility
- Visual hierarchy
- User experience
- Performance optimization

Respond with JSON:
{
  "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3"],
  "reasoning": "Overall analysis of the layout's strengths and weaknesses",
  "priority": "low|medium|high"
}`
        },
        {
          role: "user",
          content: `Analyze this HTML layout and suggest improvements:\n\n${htmlCode.substring(0, 2000)}...`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("Error analyzing layout:", error);
    throw new Error("Failed to analyze layout");
  }
}