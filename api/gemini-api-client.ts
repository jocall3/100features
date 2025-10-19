// Copyright James Burvel OÃ¢â‚¬â„¢Callaghan III
// President Citibank Demo Business Inc.

// This file provides a TypeScript client for interacting with the Gemini API's
// chat completions endpoint, abstracting the raw fetch requests based on the
// architectural blueprint and curl examples provided.

// --- Global Types and Interfaces ---

/**
 * @interface Message
 * @description Represents a single message in the chat conversation,
 *              with a role ('user' or 'model') and content.
 */
export interface Message {
  role: 'user' | 'model'; // Assuming 'user' and 'model' roles based on common LLM patterns
  content: string;
}

/**
 * @interface GeminiThinkingConfig
 * @description Configuration for Gemini's thinking behavior.
 *              Note: `reasoning_effort` and `thinking_budget` overlap functionality
 *              and cannot be used at the same time.
 */
export interface GeminiThinkingConfig {
  include_thoughts?: boolean;
  thinking_budget?: number; // Thinking budget in tokens
}

/**
 * @interface GeminiExtraBody
 * @description Structure for extra body parameters specific to Google/Gemini models,
 *              passed through the OpenAI-compatible endpoint.
 */
export interface GeminiExtraBody {
  google?: {
    thinking_config?: GeminiThinkingConfig;
  };
}

/**
 * @interface ChatCompletionsRequestBody
 * @description Defines the request body for the Gemini chat completions API endpoint.
 *              This structure is compatible with the OpenAI API for Gemini access.
 */
export interface ChatCompletionsRequestBody {
  model: string;
  messages: Message[];
  reasoning_effort?: 'low' | 'medium' | 'high' | 'none'; // For Gemini 2.5+ models, controls thinking budget
  extra_body?: GeminiExtraBody; // For advanced features like thinking config
  stream?: boolean; // If true, response will be streamed
  temperature?: number; // Controls randomness; higher values mean more random outputs (0-2)
  top_p?: number; // Nucleus sampling; considers tokens whose cumulative probability exceeds top_p (0-1)
  max_tokens?: number; // Maximum number of tokens to generate in the completion
  stop?: string | string[]; // Up to 4 sequences where the API will stop generating further tokens
}

/**
 * @interface ChatCompletionChoice
 * @description Represents a single completion choice returned by the API.
 */
export interface ChatCompletionChoice {
  index: number;
  message: Message;
  finish_reason: string | null; // e.g., "stop", "length", "content_filter"
  logprobs: null; // Placeholder, detailed logprobs usually require specific API flags
}

/**
 * @interface ChatCompletionsResponse
 * @description Defines the non-streaming response structure for the Gemini chat completions API.
 *              This is a simplified representation based on typical LLM API responses.
 */
export interface ChatCompletionsResponse {
  id: string;
  object: 'chat.completion';
  created: number; // Unix timestamp
  model: string;
  choices: ChatCompletionChoice[];
  usage?: { // Optional token usage information
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  // Note: If `include_thoughts` is true, the actual thought summaries might be
  // embedded within the message content or provided in a dedicated `extra_body`
  // field in the response, depending on the exact API behavior. For simplicity,
  // we assume the core output is within `choices[i].message.content`.
}

/**
 * @interface ChatCompletionsStreamChunk
 * @description Defines the structure of a single chunk in a streaming response from the API.
 *              Each chunk typically contains a 'delta' field with partial content.
 */
export interface ChatCompletionsStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string; // Partial content generated so far
      role?: 'user' | 'model'; // Role of the message part, usually 'model' for completions
      // Any other fields that might stream, e.g., thought summaries if explicitly part of delta
    };
    finish_reason: string | null; // Reason why the model stopped generating, present in final chunk
  }>;
}

/**
 * @const GEMINI_API_BASE_URL
 * @description The default base URL for the Gemini API's OpenAI-compatible endpoint.
 */
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const CHAT_COMPLETIONS_ENDPOINT = "chat/completions";

/**
 * @class GeminiApiClient
 * @description A TypeScript client for interacting with the Gemini API's chat completions endpoint.
 *              It abstracts the network requests, handles authentication, and supports both
 *              non-streaming and streaming responses.
 */
export class GeminiApiClient {
  private apiKey: string;
  private baseUrl: string;

  /**
   * @constructor
   * @param {string} apiKey - Your Gemini API key. This is a mandatory parameter.
   * @param {string} [baseUrl] - Optional custom base URL for the API. Defaults to `GEMINI_API_BASE_URL`.
   * @throws {Error} If the API key is not provided.
   */
  constructor(apiKey: string, baseUrl: string = GEMINI_API_BASE_URL) {
    if (!apiKey) {
      throw new Error("Gemini API Key is required for GeminiApiClient.");
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * @method chatCompletions
   * @param {ChatCompletionsRequestBody} requestBody - The request payload for chat completions.
   * @returns {Promise<ChatCompletionsResponse | AsyncGenerator<ChatCompletionsStreamChunk, void, unknown>>}
   *          A promise that resolves to a `ChatCompletionsResponse` object if `stream` is false.
   *          If `stream` is true, it returns an `AsyncGenerator` yielding `ChatCompletionsStreamChunk` objects.
   * @throws {Error} If the API request fails (e.g., network error, API returns a non-OK status).
   * @description Sends a request to the Gemini chat completions API. This method dynamically
   *              handles both non-streaming and streaming responses based on the `stream` flag
   *              in the request body.
   */
  public async chatCompletions(
    requestBody: ChatCompletionsRequestBody
  ): Promise<ChatCompletionsResponse | AsyncGenerator<ChatCompletionsStreamChunk, void, unknown>> {
    const url = `${this.baseUrl}${CHAT_COMPLETIONS_ENDPOINT}`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    };

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        let errorData: any;
        try {
          // Attempt to parse error details from the response body
          errorData = await response.json();
        } catch (e) {
          // If parsing fails, use the status text as a fallback
          errorData = { message: response.statusText || 'Unknown error' };
        }
        throw new Error(`Gemini API Error: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
      }

      if (requestBody.stream) {
        // If streaming is requested, return an async generator
        return this.handleStreamingResponse(response);
      } else {
        // Otherwise, return the full JSON response
        const data: ChatCompletionsResponse = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Failed to make Gemini chat completions request:", error);
      throw error; // Re-throw the error for the caller to handle
    }
  }

  /**
   * @private
   * @method handleStreamingResponse
   * @param {Response} response - The raw `Response` object obtained from the `fetch` API.
   * @returns {AsyncGenerator<ChatCompletionsStreamChunk, void, unknown>}
   *          An async generator that yields `ChatCompletionsStreamChunk` objects as they arrive.
   * @throws {Error} If the response body is null or if a JSON chunk cannot be parsed.
   * @description Internal method to process a streaming API response. It reads the response body
   *              as a stream, decodes each chunk, and parses it as a JSON object, specifically
   *              handling Server-Sent Events (SSE) format where data is prefixed with "data: ".
   */
  private async *handleStreamingResponse(
    response: Response
  ): AsyncGenerator<ChatCompletionsStreamChunk, void, unknown> {
    if (!response.body) {
      throw new Error("Response body is null, cannot stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = ""; // Buffer to hold incomplete lines

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break; // Stream has ended

        buffer += decoder.decode(value, { stream: true }); // Append new data to buffer

        // Process buffered data line by line
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // Keep the last (potentially incomplete) line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("data:")) {
            const jsonString = trimmedLine.substring(5).trim();
            if (jsonString === "[DONE]") {
              return; // Explicit end-of-stream signal
            }
            try {
              const chunk: ChatCompletionsStreamChunk = JSON.parse(jsonString);
              yield chunk; // Yield the parsed chunk
            } catch (e) {
              console.warn("Failed to parse JSON chunk from stream:", jsonString, e);
              // Depending on robustness requirements, this could throw an error
              // or just skip the malformed chunk. For now, it warns and continues.
            }
          }
        }
      }
    } finally {
      // Ensure the reader lock is released when the stream ends or an error occurs
      reader.releaseLock();
    }
  }
}