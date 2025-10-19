import React from 'react';
import styled from 'styled-components';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Global Types and Interfaces (Copied or imported as per seed file's exports) ---

/**
 * @interface ChallengeExample
 * @description Represents an example for a coding challenge, detailing input, output, and optional explanation.
 *              (Copied from seed as it's not exported from AiCodingChallenge.tsx)
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
 *              (Copied from seed as it's exported and critical for this component)
 */
export interface Challenge {
  id: string;
  title: string;
  problemStatement: string;
  examples: ChallengeExample[];
  constraints: string[];
  fullMarkdown: string; // Keep the original markdown for rendering flexibility
}

/**
 * @interface ThemeProps
 * @description Defines props for styled components that require access to the current theme ('light' or 'dark').
 *              (Copied from seed as it's exported and critical for this component)
 */
export interface ThemeProps {
  theme: 'light' | 'dark';
}

// --- Theming and Styled Components (Copied from seed as they are not exported) ---

/**
 * @const themeColors
 * @description A collection of color palettes for light and dark themes, promoting consistent styling.
 *              (Copied from seed as it's not exported from AiCodingChallenge.tsx)
 */
const themeColors = {
  light: {
    background: '#f8f9fa',
    text: '#212529',
    primary: '#007bff', // Bootstrap primary blue
    secondary: '#6c757d', // Bootstrap secondary grey
    border: '#dee2e6',
    cardBackground: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    background: '#212529', // Dark background
    text: '#f8f9fa', // Light text
    primary: '#6ab04c', // A friendly green for dark mode elements
    secondary: '#adb5bd', // Lighter grey for secondary text
    border: '#495057',
    cardBackground: '#343a40',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};

/**
 * @component StyledCard
 * @description A general-purpose card component used to display challenge details.
 *              Features background, shadow, and border that adapt to the current theme.
 *              (Copied from seed as it's not exported from AiCodingChallenge.tsx)
 */
const StyledCard = styled.section<ThemeProps>`
  background-color: ${(props) => themeColors[props.theme].cardBackground};
  border-radius: 12px;
  box-shadow: 0 4px 12px ${(props) => themeColors[props.theme].shadow};
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid ${(props) => themeColors[props.theme].border};

  h2 {
    color: ${(props) => themeColors[props.theme].primary};
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.8em;
  }

  p {
    line-height: 1.6;
    margin-bottom: 15px;
  }

  code {
    background-color: ${(props) => themeColors[props.theme].background};
    color: ${(props) => themeColors[props.theme].text};
    padding: 2px 4px;
    border-radius: 4px;
    font-family: 'Fira Code', 'Roboto Mono', monospace; // Enhanced monospace font stack
    font-size: 0.95em;
  }

  pre {
    background-color: ${(props) => themeColors[props.theme].background};
    color: ${(props) => themeColors[props.theme].text};
    padding: 15px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'Fira Code', 'Roboto Mono', monospace;
    font-size: 0.9em;
    line-height: 1.5;
  }

  ul {
    padding-left: 25px;
  }

  li {
    margin-bottom: 8px;
  }

  @media (max-width: 768px) {
    padding: 20px;
    h2 {
      font-size: 1.5em;
    }
  }
`;

/**
 * @interface ChallengeCardProps
 * @description Props for the `ChallengeCard` component.
 */
interface ChallengeCardProps {
  challenge: Challenge;
  theme: 'light' | 'dark';
}

/**
 * @component ChallengeCard
 * @param {ChallengeCardProps} props - The challenge data and current theme.
 * @description A memoized React component responsible for beautifully rendering a structured
 *              AI coding challenge in markdown format. It adapts its styling based on the
 *              provided `theme` prop and uses `react-markdown` for content parsing.
 */
export const ChallengeCard: React.FC<ChallengeCardProps> = React.memo(({ challenge, theme }) => {
  if (!challenge) {
    return null; // Don't render if no challenge data
  }

  /**
   * @const components
   * @description Custom renderers for `react-markdown` to override default HTML elements
   *              and apply `styled-components` styling, ensuring theme consistency.
   *              This aligns with the `ChallengeDisplay` component in the seed file.
   */
  const components = {
    // Override h1 and h2 to match primary color and adjust font sizes
    h1: ({ node, ...props }: any) => <h2 {...props} style={{ color: themeColors[theme].primary, fontSize: '2em', marginBottom: '15px' }} />,
    h2: ({ node, ...props }: any) => <h3 {...props} style={{ color: themeColors[theme].primary, fontSize: '1.5em', marginBottom: '10px' }} />,
    // Ensure paragraphs have consistent line height
    p: ({ node, ...props }: any) => <p {...props} style={{ lineHeight: 1.6, marginBottom: '1em' }} />,
    // Strong text should respect theme text color
    strong: ({ node, ...props }: any) => <strong {...props} style={{ color: themeColors[theme].text }} />,
    // Custom styling for inline and block code snippets
    code: ({ node, inline, ...props }: any) => {
      const CodeComponent = inline ? 'code' : 'pre'; // Choose `code` for inline, `pre` for blocks
      return (
        <CodeComponent
          {...props}
          style={inline ? {
            // Inline code styling
            backgroundColor: themeColors[theme].background,
            color: themeColors[theme].text,
            padding: '2px 4px',
            borderRadius: '4px',
            fontFamily: 'Fira Code, Roboto Mono, monospace',
            fontSize: '0.95em',
          } : {
            // Block code (pre) styling
            backgroundColor: themeColors[theme].background,
            color: themeColors[theme].text,
            padding: '15px',
            borderRadius: '8px',
            overflowX: 'auto', // Allow horizontal scrolling for wide code blocks
            fontFamily: 'Fira Code', 'Roboto Mono', monospace',
            fontSize: '0.9em',
            lineHeight: 1.5,
          }}
        />
      );
    },
    // Further custom renderers could be added here for lists (ul, ol, li), tables (table, th, td), etc.
    // to apply more granular theme-dependent styling.
  };

  return (
    <StyledCard theme={theme} aria-live="polite" aria-atomic="true">
      {/* react-markdown component renders the challenge's full markdown content */}
      {/* remarkGfm adds support for GitHub Flavored Markdown features */}
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {challenge.fullMarkdown}
      </Markdown>
    </StyledCard>
  );
});