import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ImagesGenerationsResponse } from 'openai/resources/images';

// --- Configuration ---
/**
 * @const GEMINI_API_KEY
 * @description Retrieves the Gemini API key from environment variables.
 *              Throws an error if the key is not set, ensuring secure API access.
 */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * @const GEMINI_BASE_URL
 * @description The base URL for the Google Generative Language API's OpenAI compatibility layer.
 *              As specified in the rubric, this redirects OpenAI SDK calls to Gemini.
 */
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables. Please set it to access Gemini API.");
}

/**
 * @const openai
 * @description An initialized OpenAI client configured to interact with the Google Gemini API.
 *              This setup allows using the OpenAI SDK's familiar interface with Gemini models.
 */
const openai = new OpenAI({
  apiKey: GEMINI_API_KEY,
  baseURL: GEMINI_BASE_URL,
});

// --- Constants ---
/**
 * @const DEFAULT_GEMINI_CHAT_MODEL
 * @description The default Gemini model to use for chat completion tasks, as recommended by the rubric.
 */
const DEFAULT_GEMINI_CHAT_MODEL = "gemini-2.0-flash";

/**
 * @const DEFAULT_GEMINI_IMAGE_GENERATION_MODEL
 * @description The default model for image generation tasks.
 *              Note: Image generation is a paid tier feature for Google.
 */
const DEFAULT_GEMINI_IMAGE_GENERATION_MODEL = "imagen-3.0-generate-002";

// --- Interfaces ---

/**
 * @interface GeminiChatCompletionOptions
 * @description Options for customizing the Gemini chat completion request when using the OpenAI SDK.
 *              Includes parameters specific to Gemini's capabilities like thinking and streaming.
 */
export interface GeminiChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  reasoning_effort?: 'none' | 'low' | 'medium' | 'high';
  include_thoughts?: boolean;
  // Further options like 'tools', 'response_format' could be added here
  // as per the OpenAI SDK's ChatCompletionCreateParams and Gemini's capabilities.
}

/**
 * @interface GeminiImageGenerationOptions
 * @description Options for customizing the Gemini image generation request.
 */
export interface GeminiImageGenerationOptions {
  model?: string;
  n?: number; // Number of images to generate
  response_format?: 'url' | 'b64_json'; // Format of the generated image response
  // size?: '256x256' | '512x512' | '1024x1024'; // Common OpenAI param, check Gemini compatibility
  // quality?: 'standard' | 'hd'; // Common OpenAI param, check Gemini compatibility
}

// --- Service Functions ---

/**
 * @function generateGeminiChatCompletion
 * @param {string} prompt - The user prompt or instruction for the AI.
 * @param {string} [systemInstruction] - Optional system instruction to guide the AI's behavior.
 * @param {GeminiChatCompletionOptions} [options] - Optional settings for the API call.
 * @returns {Promise<string | null>} - A promise that resolves to the AI's generated content (string) or null if an error occurs.
 * @description General-purpose function to interact with the Google Gemini API (via OpenAI SDK) for chat completions.
 *              It supports Gemini-specific features like `reasoning_effort` and `include_thoughts` via `extra_body`.
 */
export async function generateGeminiChatCompletion(
  prompt: string,
  systemInstruction: string = "You are a helpful AI assistant.",
  options?: GeminiChatCompletionOptions
): Promise<string | null> {
  try {
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt },
    ];

    const requestBody: OpenAI.Chat.CompletionCreateParams = {
      model: options?.model || DEFAULT_GEMINI_CHAT_MODEL,
      messages: messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 2000,
      stream: options?.stream ?? false,
      extra_body: {}, // Initialize extra_body for potential Gemini-specific parameters
    };

    // Handle Gemini-specific thinking parameters via extra_body
    if (options?.reasoning_effort) {
      // Per the rubric's curl example, reasoning_effort is a top-level field.
      // OpenAI SDK's extra_body merges its content into the top-level request.
      (requestBody.extra_body as Record<string, unknown>).reasoning_effort = options.reasoning_effort;
    } else if (options?.include_thoughts) {
      // Per the rubric's curl example, include_thoughts is explicitly nested under 'google.thinking_config'.
      (requestBody.extra_body as Record<string, unknown>).google = {
        thinking_config: {
          include_thoughts: options.include_thoughts,
        },
      };
    }

    // Clean up extra_body if it remains empty
    if (Object.keys(requestBody.extra_body as Record<string, unknown>).length === 0) {
      delete requestBody.extra_body;
    }

    const completion = await openai.chat.completions.create(requestBody);

    if (options?.stream) {
      let fullContent = '';
      // Type assertion needed as `create` returns a Stream type when `stream: true`
      for await (const chunk of completion as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>) {
        fullContent += chunk.choices[0]?.delta?.content || '';
      }
      return fullContent;
    } else {
      // Non-streaming response, type assertion to ChatCompletion
      return (completion as OpenAI.Chat.Completions.ChatCompletion).choices[0]?.message?.content || null;
    }
  } catch (error) {
    console.error("Error generating chat completion with Gemini API:", error);
    if (error instanceof OpenAI.APIError) {
      console.error("API Error Status:", error.status);
      console.error("API Error Code:", error.code);
      console.error("API Error Message:", error.message);
      console.error("API Error Type:", error.type);
    }
    return null;
  }
}

/**
 * @function generateGeminiCodingChallenge
 * @param {string} topicOrPrompt - A specific topic (e.g., "Array manipulation") or a full prompt for the challenge.
 * @param {GeminiChatCompletionOptions} [options] - Optional settings for the API call.
 * @returns {Promise<string | null>} - A promise that resolves to the generated coding challenge content (markdown string) or null.
 * @description Specializes `generateGeminiChatCompletion` to generate a coding challenge in Markdown format.
 *              It provides a predefined system instruction to guide the AI for challenge generation.
 */
export async function generateGeminiCodingChallenge(
  topicOrPrompt: string,
  options?: GeminiChatCompletionOptions
): Promise<string | null> {
  const systemInstruction = `You are an expert programming challenge generator. Create a unique, detailed coding challenge in Markdown format. 
  Include a clear problem statement, 2-3 examples with input/output, and a section for constraints. 
  Ensure the challenge is clear, concise, and solvable. Avoid generating the same challenge multiple times. 
  Focus on common data structures and algorithms.`;

  return generateGeminiChatCompletion(topicOrPrompt, systemInstruction, options);
}

/**
 * @function analyzeImageWithGemini
 * @param {string} prompt - Text prompt for image analysis, describing what to look for or ask about the image.
 * @param {string} base64Image - Base64 encoded image data (e.g., without "data:image/jpeg;base64," prefix).
 * @param {string} mimeType - MIME type of the image (e.g., "image/jpeg", "image/png").
 * @param {string} [model] - Optional Gemini model to use, defaults to `DEFAULT_GEMINI_CHAT_MODEL`.
 * @returns {Promise<string | null>} - A promise that resolves to the analysis result (string) or null.
 * @description Utilizes Gemini's multimodal capabilities to analyze a given image based on a text prompt.
 *              The image is passed as a base64 encoded string within the message content.
 */
export async function analyzeImageWithGemini(
  prompt: string,
  base64Image: string,
  mimeType: string,
  model: string = DEFAULT_GEMINI_CHAT_MODEL
): Promise<string | null> {
  try {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64Image}` },
          },
        ],
      },
    ];

    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.5, // Lower temperature for more factual analysis
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("Error analyzing image with Gemini API:", error);
    if (error instanceof OpenAI.APIError) {
      console.error("API Error Status:", error.status);
      console.error("API Error Code:", error.code);
      console.error("API Error Message:", error.message);
      console.error("API Error Type:", error.type);
    }
    return null;
  }
}

/**
 * @function generateGeminiImage
 * @param {string} prompt - The descriptive text prompt for the image to be generated.
 * @param {GeminiImageGenerationOptions} [options] - Optional settings for the image generation request.
 * @returns {Promise<ImagesGenerationsResponse | null>} - A promise that resolves to the image generation response object
 *                                                         (containing URLs or base64 data) or null on error.
 * @description Generates an image using the Gemini image generation API endpoint.
 *              Note: This feature is typically part of a paid tier for Google.
 */
export async function generateGeminiImage(
  prompt: string,
  options?: GeminiImageGenerationOptions
): Promise<ImagesGenerationsResponse | null> {
  try {
    const response = await openai.images.generate({
      model: options?.model || DEFAULT_GEMINI_IMAGE_GENERATION_MODEL,
      prompt: prompt,
      n: options?.n ?? 1,
      response_format: options?.response_format || 'b64_json', // Default to b64_json as shown in rubric
      // size: options?.size, // imagen-3.0 might not support arbitrary sizes via OpenAI SDK, check specific Gemini docs
      // quality: options?.quality, // Specific image quality, check Gemini compatibility
    });
    return response;
  } catch (error) {
    console.error("Error generating image with Gemini API:", error);
    if (error instanceof OpenAI.APIError) {
      console.error("API Error Status:", error.status);
      console.error("API Error Code:", error.code);
      console.error("API Error Message:", error.message);
      console.error("API Error Type:", error.type);
    }
    return null;
  }
}