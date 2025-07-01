import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface CodeGenerationRequest {
  description: string;
  additionalContext?: string;
  imageBase64?: string;
}

export interface CodeGenerationResponse {
  html: string;
  title: string;
  description: string;
}

export async function generateCodeFromDescription(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
  try {
    const systemPrompt = `You are an expert frontend developer specializing in creating responsive, accessible HTML layouts using Tailwind CSS. Generate complete, production-ready HTML code based on user descriptions.

Requirements:
- Use modern HTML5 semantic elements
- Apply Tailwind CSS classes for responsive design
- Include proper accessibility attributes
- Ensure mobile-first responsive design
- Use semantic color classes and proper contrast
- Include hover states and transitions where appropriate
- Generate complete HTML documents with head and body sections
- Include Tailwind CSS CDN link

Respond with JSON in this exact format:
{
  "html": "complete HTML code here",
  "title": "short descriptive title",
  "description": "brief description of the layout"
}`;

    const userPrompt = `Create a responsive HTML layout with Tailwind CSS based on this description: ${request.description}

${request.additionalContext ? `Additional context: ${request.additionalContext}` : ''}

Generate clean, semantic HTML with proper Tailwind CSS classes for styling and responsiveness.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      html: result.html || "",
      title: result.title || "Generated Layout",
      description: result.description || "AI-generated layout"
    };
  } catch (error) {
    throw new Error(`Failed to generate code: ${error.message}`);
  }
}

export async function analyzeImageAndGenerateCode(imageBase64: string, additionalContext?: string): Promise<CodeGenerationResponse> {
  try {
    const systemPrompt = `You are an expert frontend developer who can analyze UI sketches, wireframes, and screenshots to create responsive HTML layouts using Tailwind CSS.

Analyze the provided image and generate complete, production-ready HTML code that recreates the layout shown in the image.

Requirements:
- Use modern HTML5 semantic elements
- Apply Tailwind CSS classes for responsive design
- Match the layout structure shown in the image
- Include proper accessibility attributes
- Ensure mobile-first responsive design
- Use appropriate semantic color classes
- Include hover states and transitions where appropriate
- Generate complete HTML documents with head and body sections
- Include Tailwind CSS CDN link

Respond with JSON in this exact format:
{
  "html": "complete HTML code here",
  "title": "short descriptive title based on the image",
  "description": "brief description of what you see in the image"
}`;

    const userPrompt = `Analyze this UI image and create a responsive HTML layout with Tailwind CSS that recreates the design shown.

${additionalContext ? `Additional context: ${additionalContext}` : ''}

Focus on matching the layout structure, component arrangement, and overall visual hierarchy shown in the image.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      html: result.html || "",
      title: result.title || "Generated Layout from Image",
      description: result.description || "AI-generated layout from uploaded image"
    };
  } catch (error) {
    throw new Error(`Failed to analyze image and generate code: ${error.message}`);
  }
}

export async function explainCode(htmlCode: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert frontend developer. Explain HTML/CSS code in a clear, educational way. Focus on the structure, styling choices, responsive design patterns, and best practices used."
        },
        {
          role: "user",
          content: `Please explain this HTML code, focusing on the structure, Tailwind CSS classes used, responsive design patterns, and any notable features:\n\n${htmlCode}`
        }
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content || "Unable to explain the code.";
  } catch (error) {
    throw new Error(`Failed to explain code: ${error.message}`);
  }
}

export async function improveLayout(htmlCode: string, feedback?: string): Promise<CodeGenerationResponse> {
  try {
    const systemPrompt = `You are an expert frontend developer specializing in improving HTML layouts with Tailwind CSS. Analyze the provided code and suggest improvements for better design, accessibility, and user experience.

Focus on:
- Better responsive design patterns
- Improved accessibility
- Enhanced visual hierarchy
- Better spacing and typography
- Modern design trends
- Performance optimizations

Respond with JSON in this exact format:
{
  "html": "improved HTML code here",
  "title": "title for the improved layout",
  "description": "description of improvements made"
}`;

    const userPrompt = `Improve this HTML layout with better Tailwind CSS styling, responsive design, and accessibility:

${htmlCode}

${feedback ? `User feedback: ${feedback}` : ''}

Make it more modern, accessible, and visually appealing while maintaining the core structure.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      html: result.html || htmlCode,
      title: result.title || "Improved Layout",
      description: result.description || "AI-improved layout with better design and accessibility"
    };
  } catch (error) {
    throw new Error(`Failed to improve layout: ${error.message}`);
  }
}
