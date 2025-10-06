/**
 * @file LiveTypingReplay.tsx
 * @description This file contains the `LiveTypingReplay` React component,
 *              a polished, enterprise-grade module designed to simulate
 *              real-time code typing. It demonstrates best practices for
 *              building production-ready, maintainable, and scalable React applications
 *              through robust state management, responsive design,
 *              accessibility enhancements, and performance optimizations.
 *
 *              The component features:
 *              - A custom hook (`useTypingReplay`) to encapsulate replay logic.
 *              - TypeScript types for all props, state, and functions.
 *              - Controls for starting, pausing, resuming, resetting, and adjusting playback speed.
 *              - Progress indication for the replay.
 *              - Responsive layout using Tailwind CSS.
 *              - Accessibility improvements (ARIA attributes, semantic HTML).
 *              - Performance optimizations (React.memo, useCallback, useMemo).
 *              - Integration with a document title manager for better SEO/UX.
 *
 *              This module is designed to be self-contained and easily integrated
 *              into a larger React project, potentially as a "page" or a major feature
 *              within a routing system.
 *
 * @author James Burvel O’Callaghan III, President Citibank Demo Business Inc. (and AI Enhancements)
 * @version 1.2.0
 * @license MIT (assumed)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EyeIcon } from '../icons/FeatureIcons.tsx'; // Original import, MUST NOT change or remove.

// --- Utility: Document Title Manager (for SEO/UX) ---
/**
 * @function useDocumentTitle
 * @description A custom hook to set the document title dynamically.
 *              It restores the original title when the component unmounts,
 *              unless `prevailOnUnmount` is set to true.
 * @param {string} title - The title to set for the document.
 * @param {boolean} [prevailOnUnmount=false] - If true, the title will not revert on unmount.
 * @exports useDocumentTitle
 */
export const useDocumentTitle = (title: string, prevailOnUnmount: boolean = false): void => {
    const defaultTitle = React.useRef(document.title);

    useEffect(() => {
        document.title = title;
    }, [title]);

    useEffect(() => () => {
        if (!prevailOnUnmount) {
            document.title = defaultTitle.current;
        }
    }, [prevailOnUnmount]);
};

// --- Component: CodeBlockDisplay (Helper for LiveTypingReplay) ---
/**
 * @interface CodeBlockDisplayProps
 * @description Props for the `CodeBlockDisplay` component.
 * @property {string} code - The code string to display.
 * @property {boolean} showCursor - Whether to show the blinking cursor at the end of the code.
 * @property {string} [language='typescript'] - The programming language for potential syntax highlighting.
 * @property {string} [className=''] - Additional CSS classes for the container div.
 */
export interface CodeBlockDisplayProps {
    code: string;
    showCursor: boolean;
    language?: string; // Placeholder for future syntax highlighting integration
    className?: string;
}

/**
 * @function CodeBlockDisplay
 * @description A presentation component designed to display code snippets.
 *              It includes an optional blinking cursor and is optimized for
 *              performance using `React.memo` to prevent unnecessary re-renders.
 *              Can be extended with a syntax highlighter.
 * @param {CodeBlockDisplayProps} props - The properties for the component.
 * @exports CodeBlockDisplay
 */
export const CodeBlockDisplay: React.FC<CodeBlockDisplayProps> = React.memo(({ code, showCursor, language = 'typescript', className = '' }) => {
    // In a real scenario, you would integrate a syntax highlighter library here, e.g.:
    // import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
    // import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
    // import ts from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
    // SyntaxHighlighter.registerLanguage('typescript', ts);
    //
    // const highlightedCode = useMemo(() => (
    //     <SyntaxHighlighter language={language} style={atomOneDark} customStyle={{ backgroundColor: 'transparent', padding: 0 }}>
    //         {code}
    //     </SyntaxHighlighter>
    // ), [code, language]);

    return (
        <div className={`relative flex-grow font-mono text-sm bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-auto ${className}`}>
            <pre className="text-cyan-300 whitespace-pre-wrap" aria-live="polite" aria-atomic="true">
                {/* {highlightedCode} // Uncomment and use with a syntax highlighter */}
                {code}
                {showCursor && <span className="animate-pulse">|</span>}
            </pre>
        </div>
    );
});


// --- Custom Hook: useTypingReplay ---

/**
 * @enum {string} ReplayState
 * @description Defines the possible states of the typing replay simulation.
 * @exports ReplayState
 */
export enum ReplayState {
    IDLE = 'IDLE',      // Initial state, ready to start.
    PLAYING = 'PLAYING',// Replay is currently active.
    PAUSED = 'PAUSED',  // Replay is temporarily stopped.
    FINISHED = 'FINISHED',// Replay has completed.
    ERROR = 'ERROR',    // An error occurred during replay (e.g., invalid speed).
}

/**
 * @interface UseTypingReplayOptions
 * @description Configuration options for the `useTypingReplay` hook.
 * @property {string} fullCodeContent - The complete code string to be replayed.
 * @property {number} [speed=30] - The delay in milliseconds between each character typed.
 *                                   A lower number means faster typing. Must be positive.
 */
export interface UseTypingReplayOptions {
    fullCodeContent: string;
    speed?: number; // ms per char
}

/**
 * @interface UseTypingReplayReturn
 * @description The return object from the `useTypingReplay` hook, providing replay data and controls.
 * @property {string} typedCode - The currently typed code string.
 * @property {ReplayState} replayState - The current state of the replay (IDLE, PLAYING, etc.).
 * @property {number} progress - The replay progress as a percentage (0-100).
 * @property {() => void} startReplay - Function to initiate the replay from the beginning or current index if paused.
 * @property {() => void} pauseReplay - Function to pause the replay.
 * @property {() => void} resumeReplay - Function to resume a paused replay.
 * @property {() => void} resetReplay - Function to reset the replay to its initial state.
 * @property {(newSpeed: number) => void} setReplaySpeed - Function to change the replay speed dynamically.
 */
export interface UseTypingReplayReturn {
    typedCode: string;
    replayState: ReplayState;
    progress: number;
    startReplay: () => void;
    pauseReplay: () => void;
    resumeReplay: () => void;
    resetReplay: () => void;
    setReplaySpeed: (newSpeed: number) => void;
}

/**
 * @function useTypingReplay
 * @description A custom hook to manage the state and logic for a live typing replay simulation.
 *              It encapsulates all the necessary state variables and effects for controlling
 *              the typing animation, making the `LiveTypingReplay` component cleaner and more focused.
 * @param {UseTypingReplayOptions} options - Configuration options for the replay, including content and speed.
 * @returns {UseTypingReplayReturn} An object containing replay state and control functions.
 * @exports useTypingReplay
 */
export const useTypingReplay = (options: UseTypingReplayOptions): UseTypingReplayReturn => {
    const { fullCodeContent, speed: initialSpeed = 30 } = options;

    const [typedCode, setTypedCode] = useState<string>('');
    const [replayState, setReplayState] = useState<ReplayState>(ReplayState.IDLE);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [currentSpeed, setCurrentSpeed] = useState<number>(initialSpeed);

    // Effect to validate and update speed
    useEffect(() => {
        if (currentSpeed <= 0) {
            console.warn("Replay speed must be a positive number. Setting to default (30ms).");
            setCurrentSpeed(30);
            setReplayState(ReplayState.ERROR);
        } else if (replayState === ReplayState.ERROR) {
            // Clear error state if speed becomes valid
            setReplayState(ReplayState.IDLE);
        }
    }, [currentSpeed, replayState]);

    // Effect to handle the typing interval
    useEffect(() => {
        let intervalId: number | undefined;

        if (replayState === ReplayState.PLAYING) {
            intervalId = window.setInterval(() => {
                setCurrentIndex(prevIndex => {
                    const nextIndex = prevIndex + 1;
                    if (nextIndex <= fullCodeContent.length) {
                        setTypedCode(fullCodeContent.substring(0, nextIndex));
                        return nextIndex;
                    } else {
                        window.clearInterval(intervalId);
                        setReplayState(ReplayState.FINISHED);
                        return fullCodeContent.length; // Ensure index is maxed out
                    }
                });
            }, currentSpeed);
        }

        // Cleanup interval on component unmount or state change
        return () => {
            if (intervalId) {
                window.clearInterval(intervalId);
            }
        };
    }, [replayState, fullCodeContent, currentSpeed]);

    /**
     * @function startReplay
     * @description Starts the replay from the beginning or from where it left off if paused.
     */
    const startReplay = useCallback(() => {
        if (replayState === ReplayState.IDLE || replayState === ReplayState.FINISHED || replayState === ReplayState.ERROR) {
            setTypedCode('');
            setCurrentIndex(0);
        }
        setReplayState(ReplayState.PLAYING);
    }, [replayState]);

    /**
     * @function pauseReplay
     * @description Pauses the currently playing replay.
     */
    const pauseReplay = useCallback(() => {
        if (replayState === ReplayState.PLAYING) {
            setReplayState(ReplayState.PAUSED);
        }
    }, [replayState]);

    /**
     * @function resumeReplay
     * @description Resumes a paused replay.
     */
    const resumeReplay = useCallback(() => {
        if (replayState === ReplayState.PAUSED) {
            setReplayState(ReplayState.PLAYING);
        }
    }, [replayState]);

    /**
     * @function resetReplay
     * @description Resets the replay to its initial IDLE state, clearing the typed code.
     */
    const resetReplay = useCallback(() => {
        setReplayState(ReplayState.IDLE);
        setTypedCode('');
        setCurrentIndex(0);
    }, []);

    /**
     * @function setReplaySpeed
     * @description Sets a new typing speed for the replay. Validates `newSpeed` to be positive.
     * @param {number} newSpeed - The new delay in milliseconds per character.
     */
    const setReplaySpeed = useCallback((newSpeed: number) => {
        if (newSpeed > 0) {
            setCurrentSpeed(newSpeed);
        } else {
            console.error("Attempted to set non-positive replay speed. Speed must be > 0.");
            setReplayState(ReplayState.ERROR);
        }
    }, []);

    /**
     * @constant progress
     * @description Calculates the current replay progress as a percentage.
     */
    const progress = useMemo(() => {
        if (!fullCodeContent.length) return 0;
        return Math.min(100, Math.round((currentIndex / fullCodeContent.length) * 100));
    }, [currentIndex, fullCodeContent.length]);

    return {
        typedCode,
        replayState,
        progress,
        startReplay,
        pauseReplay,
        resumeReplay,
        resetReplay,
        setReplaySpeed,
    };
};

// --- Component: LiveTypingReplay (Main feature component) ---

/**
 * @constant DEFAULT_CODE_SNIPPET
 * @description A default code snippet to be used for the replay if no `codeSnippet` prop is provided.
 */
const DEFAULT_CODE_SNIPPET = `import React, { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`You clicked \${count} times\`;
    // Clean up effect if component unmounts
    return () => {
        console.log("Counter component unmounted or count changed.");
    };
  }, [count]); // Re-run effect when count changes

  const increment = () => setCount(prevCount => prevCount + 1);
  const reset = () => setCount(0);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg shadow-lg">
      <p className="text-lg mb-2">You clicked {count} times</p>
      <button 
        onClick={increment}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
        aria-label="Increment counter"
      >
        Click me
      </button>
      <button 
        onClick={reset}
        className="ml-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
        aria-label="Reset counter"
      >
        Reset
      </button>
    </div>
  );
}

export default Counter;
`;


/**
 * @interface LiveTypingReplayProps
 * @description Props for the `LiveTypingReplay` component.
 * @property {string} [codeSnippet] - The code string content to be replayed.
 *                                     If not provided, a default snippet will be used.
 * @property {number} [initialSpeed=30] - The initial typing speed in milliseconds per character.
 *                                         A lower value means faster typing.
 */
export interface LiveTypingReplayProps {
    codeSnippet?: string;
    initialSpeed?: number;
}

/**
 * @function LiveTypingReplay
 * @description A comprehensive React component that simulates live code typing.
 *              It allows users to observe a code snippet being typed out character by character,
 *              providing interactive controls for playback (start, pause, resume, reset)
 *              and speed adjustment. This component integrates `useTypingReplay` for its
 *              core logic and `CodeBlockDisplay` for presentation, ensuring a clean separation
 *              of concerns and high maintainability.
 *              The component is memoized for performance optimization.
 * @param {LiveTypingReplayProps} props - The properties for the component.
 * @exports LiveTypingReplay
 */
export const LiveTypingReplay: React.FC<LiveTypingReplayProps> = React.memo(({
    codeSnippet = DEFAULT_CODE_SNIPPET,
    initialSpeed = 30
}) => {
    useDocumentTitle("Live Typing Replay | App Demo");

    const {
        typedCode,
        replayState,
        progress,
        startReplay,
        pauseReplay,
        resumeReplay,
        resetReplay,
        setReplaySpeed
    } = useTypingReplay({ fullCodeContent: codeSnippet, speed: initialSpeed });

    const isRunning = replayState === ReplayState.PLAYING;
    const isPaused = replayState === ReplayState.PAUSED;
    const isFinished = replayState === ReplayState.FINISHED;
    const isIdle = replayState === ReplayState.IDLE;
    const isError = replayState === ReplayState.ERROR;

    /**
     * @function handleSpeedChange
     * @description Callback for when the user changes the replay speed via the select input.
     * @param {React.ChangeEvent<HTMLSelectElement>} event - The change event object.
     */
    const handleSpeedChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const newSpeed = parseInt(event.target.value, 10);
        setReplaySpeed(newSpeed);
    }, [setReplaySpeed]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-800 text-slate-100 min-h-screen">
            <header className="mb-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                 <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <EyeIcon className="w-8 h-8 text-cyan-400" />
                        <span className="ml-3">Live Typing Replay <span className="text-slate-400 text-base">(Simulation)</span></span>
                    </h1>
                    <p className="text-slate-400 mt-1 max-w-lg text-sm sm:text-base">
                        Watch a past coding session unfold character by character. 
                        This component demonstrates dynamic content playback with user controls and performance optimizations.
                    </p>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-end items-center gap-3">
                    <div className="flex items-center">
                        <label htmlFor="replay-speed" className="sr-only">Replay Speed</label>
                        <select
                            id="replay-speed"
                            onChange={handleSpeedChange}
                            value={initialSpeed} // Use the prop as initial selection, hook manages current speed
                            aria-label="Adjust replay speed"
                            className="p-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 hover:border-cyan-500 transition-colors duration-200"
                            disabled={isError}
                        >
                            <option value="100">Slow (100ms)</option>
                            <option value="50">Normal (50ms)</option>
                            <option value="30">Fast (30ms)</option>
                            <option value="10">Super Fast (10ms)</option>
                        </select>
                    </div>

                    <button
                        onClick={isPaused ? resumeReplay : startReplay}
                        disabled={isRunning && !isPaused || isError}
                        aria-label={isIdle || isFinished || isError ? 'Start Replay' : (isPaused ? 'Resume Replay' : 'Replay in Progress')}
                        className={`px-6 py-2 font-bold rounded-md transition-colors duration-200 text-sm sm:text-base
                                    ${(isRunning && !isPaused) || isError
                                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                        : 'bg-cyan-500 text-slate-900 hover:bg-cyan-600'}`}
                    >
                        {isError ? 'Error' : (isIdle || isFinished ? 'Start Replay' : (isPaused ? 'Resume' : 'Replaying...'))}
                    </button>

                    {(isRunning || isPaused) && (
                        <button
                            onClick={pauseReplay}
                            disabled={!isRunning || isError}
                            aria-label="Pause Replay"
                            className="px-6 py-2 bg-yellow-500 text-slate-900 font-bold rounded-md hover:bg-yellow-600 transition-colors duration-200 disabled:bg-slate-600 disabled:text-slate-400 text-sm sm:text-base"
                        >
                            Pause
                        </button>
                    )}

                    {(!isIdle || isError) && ( // Show reset if not idle, or if in error state
                        <button
                            onClick={resetReplay}
                            aria-label="Reset Replay"
                            className="px-6 py-2 bg-red-500 text-slate-900 font-bold rounded-md hover:bg-red-600 transition-colors duration-200 text-sm sm:text-base"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </header>

            {isError && (
                <div role="alert" className="mb-4 p-3 bg-red-800 text-red-100 rounded-md text-center">
                    <p className="font-semibold">Replay Error:</p>
                    <p>An issue occurred during replay. Please reset and try again. Ensure speed is a positive number.</p>
                </div>
            )}

            <div className="mb-4 text-center text-slate-300">
                <p className="text-lg mb-2">Progress: {progress}%</p>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div
                        className="bg-cyan-500 h-2.5 rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    ></div>
                </div>
            </div>

            <CodeBlockDisplay code={typedCode} showCursor={replayState !== ReplayState.FINISHED && replayState !== ReplayState.ERROR} className="flex-grow" />

            {/* Optional: Simulated output/console below the code block for a more interactive feel */}
            {/*
            <div className="mt-6 p-4 bg-slate-900 border border-slate-700 rounded-lg max-h-48 overflow-auto">
                <h3 className="text-xl font-semibold text-slate-200 mb-2">Simulated Output:</h3>
                <pre className="text-green-400 text-sm font-mono">
                    {replayState === ReplayState.FINISHED && `// Replay finished. Code is now runnable.\nOutput: Hello World! (simulated)`}
                    {replayState === ReplayState.PLAYING && `// Typing in progress...`}
                    {replayState === ReplayState.PAUSED && `// Replay paused. Current state saved.`}
                    {replayState === ReplayState.IDLE && `// Ready to start replay.`}
                    {replayState === ReplayState.ERROR && `// Error occurred. Output unavailable.`}
                </pre>
            </div>
            */}
        </div>
    );
});