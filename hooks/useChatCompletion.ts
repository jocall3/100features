// Copyright James Burvel O'Callaghan III
// President Citibank Demo Business Inc.

import { useState, useCallback } from 'react';

/**
 * @interface ChatMessage
 * @description Defines the structure for a message in a chat conversation.
 *              Roles can be 'user', 'model', or 'system'.
 */
export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

/**
 * @interface ChatCompletionRequestBody
 * @description Defines the parameters for requesting a chat completion from the Gemini API
 *              via the OpenAI-compatible endpoint.
 */
export interface ChatCompletionRequestBody {
  model: string;
  messages: ChatMessage[];
  reasoning_effort?: 'none' | 'low' | 'medium' | 'high';
  extra_body?: {
    google: {
      thinking_config?: {
        include_thoughts?: boolean;
      };
    };
  };
  stream?: boolean;
}

/**
 * @interface ChatCompletionChoice
 * @description Represents a single choice (response) from the AI in a chat completion.
 */
export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  logprobs: null; // As per OpenAI spec, often null for chat completions
  finish_reason: string;
}

/**
 * @interface ChatCompletionResponse
 * @description Defines the full response structure for a non-streaming chat completion.
 */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Environment variable for Gemini API Key. In a production React app, this would be set
// during build time (e.g., using .env files with tools like create-react-app or Vite).
// For demonstration, a placeholder is used if the env var is not set.
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
const GEMINI_COMPLETIONS_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

/**
 * @function useChatCompletion
 * @description A custom React hook for managing the state and logic associated with fetching
 *              AI chat completions from the Gemini API via its OpenAI-compatible endpoint.
 *              It handles loading states, errors, and provides a function to send chat requests.
 * @returns {object} An object containing:
 *   - `response`: The latest `ChatCompletionResponse` or `null`.
 *   - `isLoading`: A boolean indicating if a request is currently in progress.
 *   - `error`: A string containing any error message, or `null`.
 *   - `sendChatRequest`: A memoized function to initiate a chat completion request.
 */
export const useChatCompletion = () => {
  const [response, setResponse] = useState<ChatCompletionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * @function sendChatRequest
   * @param {ChatCompletionRequestBody} params - The request parameters for the chat completion.
   * @description An asynchronous function to send a POST request to the Gemini API's
   *              chat completions endpoint. It updates the hook's state based on the
   *              request's lifecycle (loading, success, error).
   *              Note: For `stream: true`, this current implementation reads the full response
   *              body at once. A full-fledged streaming implementation would typically
   *              involve processing `text/event-stream` chunks incrementally.
   */
  const sendChatRequest = useCallback(async (params: ChatCompletionRequestBody) => {
    setIsLoading(true);
    setError(null);
    setResponse(null); // Clear previous response before a new request

    try {
      if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('Gemini API Key is not configured. Please set REACT_APP_GEMINI_API_KEY.');
      }

      const body: any = {
        model: params.model,
        messages: params.messages,
        stream: params.stream || false, // Default to non-streaming if not explicitly set
      };

      if (params.reasoning_effort) {
        body.reasoning_effort = params.reasoning_effort;
      }
      if (params.extra_body) {
        body.extra_body = params.extra_body;
      }

      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GEMINI_API_KEY}`,
        },
        body: JSON.stringify(body),
      };

      const fetchResponse = await fetch(GEMINI_COMPLETIONS_URL, fetchOptions);

      if (!fetchResponse.ok) {
        // Attempt to parse error message from response body
        const errorData = await fetchResponse.json().catch(() => ({ message: 'Unknown error or non-JSON error response' }));
        const errorMessage = errorData.message || JSON.stringify(errorData) || fetchResponse.statusText;
        throw new Error(`API Error ${fetchResponse.status}: ${errorMessage}`);
      }

      // Important Note on Streaming:
      // The provided blueprint curl examples for streaming only show the *request* parameter
      // (`"stream": true`), but not the *output format* of a streamed response.
      // Standard OpenAI-compatible streaming typically involves `text/event-stream` or
      // newline-delimited JSON chunks that need to be processed incrementally.
      //
      // For this blueprint, and lacking specific streaming output examples from the Gemini API,
      // this implementation will `await fetchResponse.json()` even if `stream: true` is set.
      // This means it will wait for the *entire* response to be received and parsed as a single JSON object.
      // A true streaming implementation would require reading `fetchResponse.body.getReader()`
      // and processing chunks as they arrive, updating the UI progressively.
      // This is a pragmatic compromise for the given context.
      const jsonResponse: ChatCompletionResponse = await fetchResponse.json();
      setResponse(jsonResponse);

      if (params.stream) {
        console.warn("`stream: true` was requested. `useChatCompletion` is currently configured to wait for the full response and parse it as a single JSON object. For incremental UI updates, a dedicated stream parsing logic (e.g., using `ReadableStreamDefaultReader`) would be required.");
      }

    } catch (err) {
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error('Error fetching chat completion:', err); // Log the full error for debugging
    } finally {
      setIsLoading(false);
    }
  }, []); // `GEMINI_API_KEY` is from environment, `GEMINI_COMPLETIONS_URL` is a constant, `dispatch` not used here, so no dependencies for `useCallback`

  return { response, isLoading, error, sendChatRequest };
};