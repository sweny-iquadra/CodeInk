import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
// });

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("Missing OpenAI API key. Set OPENAI_API_KEY in your .env file.");
}

const openai = new OpenAI({ apiKey });

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
    const systemPrompt = `You are an expert frontend developer. Create responsive HTML layouts with Tailwind CSS quickly and efficiently.

Generate HTML with:
- Modern semantic elements
- Tailwind CSS classes for responsive design
- Clean, minimal structure
- Complete HTML document with Tailwind CDN

JSON format:
{
  "html": "HTML code",
  "title": "layout title",
  "description": "brief description"
}`;

    const userPrompt = `Create: ${request.description}${request.additionalContext ? ` (${request.additionalContext})` : ''}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 3000,
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
    const systemPrompt = `Expert frontend developer. Analyze images and create HTML layouts with Tailwind CSS efficiently.

Create HTML matching the image structure with:
- Semantic elements
- Tailwind CSS responsive design
- Complete HTML with CDN

JSON format:
{
  "html": "HTML code",
  "title": "layout title",
  "description": "image description"
}`;

    const userPrompt = `Create HTML from this image${additionalContext ? ` (${additionalContext})` : ''}`;

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
      temperature: 0.5,
      max_tokens: 3000,
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
    const systemPrompt = `Expert frontend developer. Improve HTML layouts with Tailwind CSS efficiently.

Enhance:
- Responsive design
- Accessibility
- Visual appeal
- Modern styling

JSON format:
{
  "html": "improved HTML",
  "title": "layout title", 
  "description": "improvements made"
}`;

    const userPrompt = `Improve layout: ${feedback || 'Better design, responsiveness, accessibility'}\n\n${htmlCode.substring(0, 1500)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 3000,
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
