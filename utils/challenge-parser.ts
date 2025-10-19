// Copyright James Burvel OÃ¢â‚¬â„¢Callaghan III
// President Citibank Demo Business Inc.

// utils/challenge-parser.ts
//
// This file contains utility functions specifically designed for parsing raw markdown content
// received from an AI service (like the Gemini API, or a mock equivalent) into a structured
// `Challenge` object. This structured data can then be easily consumed and rendered by the
// frontend application.
//
// Goal: Provide robust and type-safe parsing logic to transform unstructured markdown
//       into a well-defined data model for coding challenges, improving data consistency
//       and maintainability.

// --- Global Types and Interfaces ---

/**
 * @interface ChallengeExample
 * @description Represents an example for a coding challenge, detailing input, output, and optional explanation.
 */
export interface ChallengeExample {
  input: string;
  output: string;
  explanation?: string;
}

/**
 * @interface Challenge
 * @description Defines the structure of an AI-generated coding challenge, parsed from markdown.
 *              Includes an ID, title, problem statement, examples, constraints, and the full original markdown.
 */
export interface Challenge {
  id: string;
  title: string;
  problemStatement: string;
  examples: ChallengeExample[];
  constraints: string[];
  fullMarkdown: string; // Keep the original markdown for rendering flexibility
}

// --- Utility Functions ---

/**
 * @function parseMarkdownChallenge
 * @param {string} markdownContent - The raw markdown string obtained from the AI service.
 * @returns {Challenge} - A structured `Challenge` object after parsing the markdown.
 * @description This function parses the raw markdown content into a structured `Challenge` object.
 *              It's designed to extract specific sections like title, problem statement, examples,
 *              and constraints based on expected markdown headings and formatting from the API response.
 */
export const parseMarkdownChallenge = (markdownContent: string): Challenge => {
  const lines = markdownContent.split('\n');
  let title = 'Untitled Challenge';
  let problemStatement = '';
  const examples: ChallengeExample[] = [];
  const constraints: string[] = [];

  let mode: 'title' | 'problem' | 'examples' | 'constraints' | 'none' = 'none';
  let currentExample: Partial<ChallengeExample> = {};

  for (const line of lines) {
    if (line.startsWith('# Coding Challenge:')) {
      title = line.replace('# Coding Challenge:', '').trim();
      mode = 'problem';
      continue;
    }
    if (line.startsWith('**Problem Statement:**')) {
      mode = 'problem';
      problemStatement = ''; // Reset problem statement for accurate parsing
      continue;
    }
    if (line.startsWith('**Example ')) {
      // Before starting a new example, push the previous one if complete
      if (currentExample.input && currentExample.output) {
        examples.push(currentExample as ChallengeExample);
      }
      currentExample = {}; // Reset for the new example
      mode = 'examples';
      continue;
    }
    if (line.startsWith('**Constraints:**')) {
      // Push the last example before switching to constraints mode
      if (currentExample.input && currentExample.output) {
        examples.push(currentExample as ChallengeExample);
      }
      mode = 'constraints';
      continue;
    }

    // Accumulate content based on the current parsing mode
    if (mode === 'problem' && !line.startsWith('**Example ') && !line.startsWith('**Constraints:**')) {
      problemStatement += line + '\n';
    } else if (mode === 'examples') {
      if (line.startsWith('Input:')) {
        currentExample.input = line.replace('Input:', '').trim();
      } else if (line.startsWith('Output:')) {
        currentExample.output = line.replace('Output:', '').trim();
      } else if (line.includes('(') && line.includes('underscores represent irrelevant values')) {
        currentExample.explanation = line.trim();
      }
    } else if (mode === 'constraints' && line.trim().startsWith('*')) {
      constraints.push(line.replace('*', '').trim());
    }
  }

  // Ensure any final example is pushed
  if (currentExample.input && currentExample.output) {
    examples.push(currentExample as ChallengeExample);
  }

  return {
    id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID generation
    title,
    problemStatement: problemStatement.trim(),
    examples,
    constraints,
    fullMarkdown: markdownContent,
  };
};