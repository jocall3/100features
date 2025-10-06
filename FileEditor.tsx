// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

// File: FileEditor.tsx
// Description:
// This file provides a sophisticated, enterprise-grade simulation of a multi-tab
// code editor. It demonstrates best practices including TypeScript types,
// simulated asynchronous data fetching, local state management for editable content,
// loading/error states, responsive styling with Tailwind CSS, accessibility
// enhancements, and performance optimizations.
//
// Features:
// - Multi-tab interface for file selection.
// - Editable content with real-time updates to local state.
// - Simulated asynchronous file loading with loading and error states.
// - Simulated asynchronous save operation with debouncing and status indicators.
// - Responsive design adapting to various screen sizes.
// - Accessibility improvements for keyboard navigation and screen readers.
// - Performance optimization using `React.memo` and `useCallback`.
// - Clear TypeScript interfaces for data structures.
//
// This component is designed to be self-contained and easily integrated into a
// larger React application, demonstrating how a complex UI element can be built
// with modern React principles.

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CodeBracketIcon } from '../icons/FeatureIcons'; // Assuming this path is correct relative to app.tsx

// --- Component: Types and Interfaces ---
/**
 * Interface representing a single file in the editor.
 * @property {string} id - A unique identifier for the file.
 * @property {string} name - The name of the file (e.g., 'index.js').
 * @property {string} content - The current editable content of the file.
 * @property {string} originalContent - The content of the file as it was initially loaded or last saved.
 * @property {boolean} isSaved - Indicates if the current content matches the original (i.e., no unsaved changes).
 */
export interface FileItem {
  id: string;
  name: string;
  content: string;
  originalContent: string;
  isSaved: boolean;
}

/**
 * Props for the FileEditor component.
 * Currently empty, but extensible for future features like initial files prop.
 */
export interface FileEditorProps {}

// --- Component: Utility Functions / Data Simulation ---

/**
 * Raw mock file data to simulate initial fetching.
 */
const initialRawMockFiles: Record<string, string> = {
  'index.js': `console.log("Hello, World!");\n\n// This is an editable simulation. Try changing me!\n// Function to greet
function greet(name: string): void {
  console.log(\`Hello, \${name}!\`);
}

greet("Developer");
`,
  'styles.css': `body {\n  background-color: #1a202c;\n  color: #e2e8f0;\n  font-family: 'Roboto Mono', monospace;\n}\n\n.editor-container {\n  border: 1px solid #4a5568;\n  border-radius: 8px;\n  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n}\n\n/* Responsive text area */\n@media (max-width: 768px) {\n  .editor-textarea {\n    font-size: 0.875rem; /* text-sm */\n  }\n}\n`,
  'README.md': `# My Project\n\nThis is a sample project demonstrating an enterprise-grade file editor simulation.\n\n## Instructions\n\n1. Select a file tab to view or edit its content.\n2. Make changes in the text area.\n3. The 'Save' button will become active when there are unsaved changes.\n4. Click 'Save' to simulate persisting your changes. A success message will appear.\n5. You can switch between files, and changes to the active file will be maintained locally until saved.\n\n## Technologies Used\n\n- React with TypeScript\n- Tailwind CSS for styling\n- Functional Components with Hooks`
};

/**
 * Transforms raw mock files into the structured `FileItem` format.
 * @param rawFiles - An object where keys are filenames and values are file contents.
 * @returns An array of `FileItem` objects.
 */
const transformMockFiles = (rawFiles: Record<string, string>): FileItem[] => {
  return Object.entries(rawFiles).map(([name, content], index) => ({
    id: `file-${index}-${name.replace(/[^a-zA-Z0-9]/g, '-')}`, // Simple, safe ID generation
    name,
    content,
    originalContent: content,
    isSaved: true,
  }));
};

/**
 * Simulates an asynchronous fetch for file data.
 * @param delay - The delay in milliseconds to simulate network latency.
 * @returns A Promise that resolves with an array of `FileItem` objects.
 */
const simulateFileFetch = (delay: number = 1000): Promise<FileItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(transformMockFiles(initialRawMockFiles));
    }, delay);
  });
};

/**
 * Simulates an asynchronous save operation for file data.
 * @param fileToSave - The `FileItem` object to be saved.
 * @param delay - The delay in milliseconds to simulate network latency.
 * @param shouldFail - Optional: If true, the save operation will simulate a failure.
 * @returns A Promise that resolves with a boolean indicating success or throws an error.
 */
const simulateFileSave = (
  fileToSave: FileItem,
  delay: number = 700,
  shouldFail: boolean = false
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(`Failed to save file '${fileToSave.name}'. Please try again.`));
      } else {
        console.log(`Simulated save for file: ${fileToSave.name}`);
        resolve(true);
      }
    }, delay);
  });
};

// --- Component: FileEditor ---
/**
 * `FileEditor` is a feature-rich React component that simulates a multi-tab
 * code editor. It demonstrates robust state management for file content,
 * asynchronous operations with loading/error handling, and a user-friendly
 * interface built with accessibility and performance in mind.
 */
export const FileEditor: React.FC<FileEditorProps> = React.memo(() => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Ref for debouncing save operations
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Effect hook to simulate fetching initial files on component mount.
   * Handles loading and error states.
   */
  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedFiles = await simulateFileFetch();
        setFiles(fetchedFiles);
        if (fetchedFiles.length > 0) {
          setActiveFileId(fetchedFiles[0].id); // Set the first file as active
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during file fetch.');
        console.error("File fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  /**
   * Finds the currently active file from the `files` array.
   * Uses `useMemo` to prevent unnecessary recalculations if `files` or `activeFileId` haven't changed.
   * @returns The `FileItem` object for the active file, or `undefined` if not found.
   */
  const activeFile = useMemo(() => {
    return files.find(file => file.id === activeFileId);
  }, [files, activeFileId]);

  /**
   * Handles tab clicks, setting the new active file.
   * Uses `useCallback` to memoize the function, preventing unnecessary re-renders of tab buttons.
   * @param fileId - The ID of the file to activate.
   */
  const handleTabClick = useCallback((fileId: string) => {
    setActiveFileId(fileId);
    setSaveStatus('idle'); // Reset save status when switching tabs
  }, []);

  /**
   * Handles changes in the textarea content.
   * Updates the `content` and `isSaved` status of the active file in state.
   * Uses `useCallback` for performance.
   * @param event - The change event from the textarea.
   */
  const handleContentChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === activeFileId
          ? { ...file, content: newContent, isSaved: newContent === file.originalContent }
          : file
      )
    );
    // Reset save status if content changes
    setSaveStatus('idle');
  }, [activeFileId]);

  /**
   * Handles the save action for the active file.
   * Simulates an async save with a debounce mechanism.
   * Updates `isSaving` and `saveStatus`.
   * Uses `useCallback` for performance.
   */
  const handleSave = useCallback(async () => {
    if (!activeFile || activeFile.isSaved || isSaving) {
      return; // Prevent saving if no changes or already saving
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    setSaveStatus('saving');

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await simulateFileSave(activeFile);
        setFiles(prevFiles =>
          prevFiles.map(file =>
            file.id === activeFileId
              ? { ...file, originalContent: file.content, isSaved: true }
              : file
          )
        );
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000); // Clear saved status after a few seconds
      } catch (err) {
        setSaveStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to save file.');
        console.error("File save error:", err);
      } finally {
        setIsSaving(false);
      }
    }, 500); // Debounce save by 500ms
  }, [activeFile, activeFileId, isSaving]);

  // Determine button state and text
  const isSaveButtonDisabled = !activeFile || activeFile.isSaved || isSaving;
  const saveButtonText = useMemo(() => {
    if (isSaving) return 'Saving...';
    if (saveStatus === 'saved') return 'Saved!';
    if (saveStatus === 'error') return 'Save Error';
    return 'Save Changes';
  }, [isSaving, saveStatus]);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100">
      <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center text-cyan-400">
          <CodeBracketIcon className="h-8 w-8 text-cyan-500" />
          <span className="ml-3">Enterprise File Editor</span>
        </h1>
        <p className="text-slate-400 mt-1">A robust simulation of a multi-tab code editor with advanced features.</p>
        <p className="text-sm text-slate-500 italic">
          (Content is stored in local component state. Changes are not persistent across refreshes.)
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="bg-red-800 text-white p-3 rounded-md mb-4 flex items-center justify-between"
        >
          <span>Error: {error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-sm font-medium hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Dismiss error message"
          >
            &times;
          </button>
        </div>
      )}

      <div className="flex-grow flex flex-col bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-xl editor-container">
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center text-xl text-cyan-300">
            <svg className="animate-spin -ml-1 mr-3 h-7 w-7 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading files...
          </div>
        ) : (
          <>
            <div role="tablist" aria-label="File Tabs" className="flex bg-slate-800 border-b border-slate-700 overflow-x-auto">
              {files.map(file => (
                <button
                  key={file.id}
                  role="tab"
                  id={`tab-${file.id}`}
                  aria-controls={`panel-${file.id}`}
                  aria-selected={activeFileId === file.id}
                  onClick={() => handleTabClick(file.id)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-500
                    ${activeFileId === file.id
                      ? 'bg-slate-900 text-cyan-400 border-b-2 border-cyan-500'
                      : 'text-slate-400 hover:bg-slate-700/50'
                    }
                    ${!file.isSaved && activeFileId !== file.id ? 'relative after:content-[""] after:absolute after:top-2 after:right-2 after:w-2 after:h-2 after:rounded-full after:bg-orange-500 after:animate-pulse' : ''}
                    `}
                    tabIndex={activeFileId === file.id ? 0 : -1} // Only active tab is tabbable
                >
                  {file.name}
                  {!file.isSaved && (
                    <span className="ml-2 text-xs text-orange-400" aria-label="Unsaved changes">*</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex-grow flex flex-col relative">
              <textarea
                id={`panel-${activeFileId}`}
                aria-labelledby={`tab-${activeFileId}`}
                role="tabpanel"
                value={activeFile?.content || ''}
                onChange={handleContentChange}
                className="w-full h-full p-4 bg-transparent resize-none font-mono text-sm sm:text-base text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 editor-textarea"
                aria-label={`Content of ${activeFile?.name || 'selected file'}`}
                spellCheck="false"
              />
              <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                {saveStatus === 'saved' && (
                  <span className="text-green-400 text-sm font-medium animate-pulse" role="status">
                    Saved!
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-400 text-sm font-medium" role="alert">
                    Save Failed!
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaveButtonDisabled}
                  className={`px-5 py-2 rounded-md font-semibold text-white transition-colors duration-200
                    ${isSaveButtonDisabled
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900'
                    }`}
                  aria-live="polite"
                  aria-disabled={isSaveButtonDisabled}
                >
                  {saveButtonText}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

// Setting a display name for React DevTools
FileEditor.displayName = 'FileEditor';