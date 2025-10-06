// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

// This file provides a robust and feature-rich Snippet Vault component for a React application.
// It allows users to view, search, add, update (implicitly via form re-submission logic or an explicit edit modal),
// delete, and quickly copy code snippets.
//
// Features include:
// -   **TypeScript:** Strong typing for all interfaces, props, and hooks.
// -   **State Management:** Uses React Context API for managing snippets, making it scalable.
// -   **Persistence:** Custom `useLocalStorage` hook for saving snippets locally.
// -   **Error Handling:** Graceful handling and display of errors during localStorage operations.
// -   **Loading States:** Visual feedback for asynchronous operations (simulated).
// -   **Search/Filtering:** Dynamic filtering of snippets by name, code content, or tags.
// -   **Add Snippet Form:** Dedicated form to easily add new snippets with name, code, and tags.
// -   **Delete Snippet:** Functionality to remove snippets.
// -   **Copy to Clipboard:** One-click copy with visual feedback.
// -   **Performance Optimization:** `React.memo`, `useCallback`, `useMemo` for efficient rendering.
// -   **Accessibility (A11y):** Semantic HTML, ARIA attributes for improved user experience.
// -   **Responsive Styling:** Uses Tailwind CSS classes for adaptive layouts.
// -   **Modular Design:** Components broken down into smaller, reusable units (`SnippetCard`, `AddSnippetForm`).
//
// This component aims to be a production-ready, maintainable, and scalable solution for snippet management.

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { CodeBracketIcon } from '../icons/FeatureIcons.tsx';

// --- Type Definitions ---
/**
 * @interface Snippet
 * @description Defines the structure for a code snippet.
 */
export interface Snippet {
    id: string; // Changed to string for UUIDs, more robust
    name: string;
    code: string;
    tags?: string[]; // New: Add tags for better organization/filtering
    createdAt?: number; // New: Timestamp for creation
    updatedAt?: number; // New: Timestamp for last update
}

// --- Context API for Snippet Management ---
/**
 * @interface SnippetContextType
 * @description Defines the shape of the context value for snippet management.
 */
interface SnippetContextType {
    snippets: Snippet[];
    addSnippet: (name: string, code: string, tags?: string[]) => void;
    updateSnippet: (id: string, newName: string, newCode: string, newTags?: string[]) => void;
    deleteSnippet: (id: string) => void;
    loading: boolean;
    error: string | null;
}

const SnippetContext = createContext<SnippetContextType | undefined>(undefined);

/**
 * @function useSnippets
 * @description A custom hook to access snippet data and management functions from the SnippetContext.
 * @throws {Error} if used outside of a SnippetProvider.
 * @returns {SnippetContextType}
 */
export const useSnippets = (): SnippetContextType => {
    const context = useContext(SnippetContext);
    if (!context) {
        throw new Error('useSnippets must be used within a SnippetProvider');
    }
    return context;
};

// --- Custom Hooks ---
/**
 * @function useLocalStorage
 * @description A custom hook to interact with localStorage, providing state and persistent storage.
 * Handles initial loading, errors, and synchronous updates to localStorage.
 * @template T
 * @param {string} key - The key for localStorage.
 * @param {T} initialValue - The initial value if no item is found in localStorage.
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>, boolean, string | null]} - Value, setter, loading status, error status.
 */
export const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean, string | null] => {
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Effect for initial load from localStorage
    useEffect(() => {
        try {
            if (typeof window === 'undefined' || !window.localStorage) {
                console.warn("localStorage is not available.");
                setLoading(false);
                return;
            }
            const item = window.localStorage.getItem(key);
            setStoredValue(item ? JSON.parse(item) : initialValue);
            setError(null);
        } catch (e: any) {
            console.error(`Error reading from localStorage for key "${key}":`, e);
            setError(`Failed to load data from local storage: ${e.message}`);
            setStoredValue(initialValue); // Ensure state is reset to initial on error
        } finally {
            setLoading(false);
        }
    }, [key, initialValue]);

    // This effect handles writing to localStorage when storedValue changes.
    // It's separated from the initial read to avoid potential race conditions
    // and ensure updates trigger persistence.
    const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback((value: T | ((val: T) => T)) => {
        try {
            if (typeof window === 'undefined' || !window.localStorage) {
                console.warn("localStorage is not available. Cannot save data.");
                return;
            }
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            setError(null); // Clear previous errors on successful save
        } catch (e: any) {
            console.error(`Error writing to localStorage for key "${key}":`, e);
            setError(`Failed to save data to local storage: ${e.message}`);
        }
    }, [key, storedValue]); // `storedValue` is intentionally in dependencies to get the latest state for functional updates

    return [storedValue, setValue, loading, error];
};

// --- Snippet Provider Component ---
/**
 * @component SnippetProvider
 * @description Provides snippet data and management functions to its children components using Context API.
 * This component is designed to wrap the main application or a section that requires snippet access.
 * @param {React.PropsWithChildren<{}>} props
 */
export const SnippetProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [snippets, setSnippets, loading, error] = useLocalStorage<Snippet[]>('devcore_snippets', []);

    const addSnippet = useCallback((name: string, code: string, tags: string[] = []) => {
        const newSnippet: Snippet = {
            id: crypto.randomUUID(), // Use crypto.randomUUID for robust unique IDs
            name,
            code,
            tags: tags.map(tag => tag.toLowerCase()), // Ensure tags are lowercase for consistent filtering
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        setSnippets(prev => [...prev, newSnippet]);
    }, [setSnippets]);

    const updateSnippet = useCallback((id: string, newName: string, newCode: string, newTags: string[] = []) => {
        setSnippets(prev => prev.map(s => s.id === id ? { ...s, name: newName, code: newCode, tags: newTags.map(tag => tag.toLowerCase()), updatedAt: Date.now() } : s));
    }, [setSnippets]);

    const deleteSnippet = useCallback((id: string) => {
        setSnippets(prev => prev.filter(s => s.id !== id));
    }, [setSnippets]);

    const contextValue = useMemo(() => ({
        snippets,
        addSnippet,
        updateSnippet,
        deleteSnippet,
        loading,
        error
    }), [snippets, addSnippet, updateSnippet, deleteSnippet, loading, error]);

    return (
        <SnippetContext.Provider value={contextValue}>
            {children}
        </SnippetContext.Provider>
    );
};

// --- Components ---

/**
 * @component AddSnippetForm
 * @description A form component for adding new code snippets.
 * Includes input fields for name, code, and tags, with basic validation and submission feedback.
 * @param {object} props
 * @param {() => void} [props.onSnippetAdded] - Optional callback function after a snippet is successfully added.
 */
export const AddSnippetForm: React.FC<{ onSnippetAdded?: () => void }> = ({ onSnippetAdded }) => {
    const { addSnippet } = useSnippets();
    const [name, setName] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [tags, setTags] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formFeedback, setFormFeedback] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!name.trim() || !code.trim()) {
            setFormFeedback('Name and code are required.');
            setIsSuccess(false);
            return;
        }
        setIsSubmitting(true);
        setFormFeedback(null);
        setIsSuccess(false);

        try {
            // Simulate an asynchronous operation, e.g., saving to a backend API
            await new Promise(resolve => setTimeout(resolve, 500));
            addSnippet(name.trim(), code.trim(), tags.split(',').map(tag => tag.trim()).filter(Boolean));
            setName('');
            setCode('');
            setTags('');
            setFormFeedback('Snippet added successfully!');
            setIsSuccess(true);
            onSnippetAdded?.(); // Trigger callback
        } catch (error) {
            console.error('Failed to add snippet:', error);
            setFormFeedback('Failed to add snippet. Please try again.');
            setIsSuccess(false);
        } finally {
            setIsSubmitting(false);
            setTimeout(() => {
                setFormFeedback(null);
                setIsSuccess(false);
            }, 3000); // Clear feedback after 3 seconds
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-800/60 p-6 rounded-lg shadow-xl mb-8 border border-slate-700" aria-labelledby="add-snippet-heading">
            <h2 id="add-snippet-heading" className="text-2xl font-semibold text-slate-100 mb-4">Add New Snippet</h2>
            {formFeedback && (
                <div className={`p-3 mb-4 rounded-md text-sm ${isSuccess ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`} role="status" aria-live="polite">
                    {formFeedback}
                </div>
            )}
            <div className="mb-4">
                <label htmlFor="snippet-name" className="block text-slate-300 text-sm font-bold mb-2">Snippet Name:</label>
                <input
                    id="snippet-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="shadow appearance-none border border-slate-600 rounded w-full py-2 px-3 text-slate-100 leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-700/50 placeholder-slate-400"
                    placeholder="e.g., React Functional Component Template"
                    aria-required="true"
                    required
                    disabled={isSubmitting}
                />
            </div>
            <div className="mb-4">
                <label htmlFor="snippet-code" className="block text-slate-300 text-sm font-bold mb-2">Code:</label>
                <textarea
                    id="snippet-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="shadow appearance-none border border-slate-600 rounded w-full py-2 px-3 text-slate-100 leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-700/50 placeholder-slate-400 font-mono resize-y h-32"
                    placeholder="Paste your code here..."
                    aria-required="true"
                    required
                    disabled={isSubmitting}
                ></textarea>
            </div>
            <div className="mb-6">
                <label htmlFor="snippet-tags" className="block text-slate-300 text-sm font-bold mb-2">Tags (comma-separated):</label>
                <input
                    id="snippet-tags"
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="shadow appearance-none border border-slate-600 rounded w-full py-2 px-3 text-slate-100 leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-700/50 placeholder-slate-400"
                    placeholder="e.g., react, hook, utility"
                    disabled={isSubmitting}
                />
            </div>
            <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isSubmitting || !name.trim() || !code.trim()}
                aria-live="polite"
            >
                {isSubmitting ? 'Adding Snippet...' : 'Add Snippet'}
            </button>
        </form>
    );
};

/**
 * @component SnippetCard
 * @description Displays a single code snippet with copy and delete functionality.
 * Optimized with `React.memo` to prevent unnecessary re-renders.
 * @param {object} props
 * @param {Snippet} props.snippet - The snippet data to display.
 * @param {(code: string) => void} props.onCopy - Callback when the copy button is clicked.
 * @param {(id: string) => void} props.onDelete - Callback when the delete button is clicked.
 */
export const SnippetCard: React.FC<{ snippet: Snippet; onCopy: (code: string) => void; onDelete: (id: string) => void }> = React.memo(({ snippet, onCopy, onDelete }) => {
    return (
        <div className="bg-slate-800/50 p-4 rounded-lg flex flex-col justify-between border border-slate-700 hover:border-cyan-500 transition-colors duration-200" role="listitem" aria-labelledby={`snippet-name-${snippet.id}`}>
            <h3 id={`snippet-name-${snippet.id}`} className="font-bold text-slate-200 truncate mb-2">{snippet.name}</h3>
            {snippet.tags && snippet.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2" aria-label="Snippet tags">
                    {snippet.tags.map(tag => (
                        <span key={tag} className="text-xs text-cyan-400 bg-cyan-900/40 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                </div>
            )}
            <pre className="text-xs text-slate-400 bg-slate-900 p-2 rounded-md my-2 overflow-x-auto h-24 whitespace-pre-wrap" tabIndex={0} aria-describedby={`snippet-name-${snippet.id}`}>
                {snippet.code}
            </pre>
            <div className="flex gap-2 mt-2">
                <button
                    onClick={() => onCopy(snippet.code)}
                    className="flex-grow text-sm py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    aria-label={`Copy code for snippet: ${snippet.name}`}
                >
                    Copy
                </button>
                <button
                    onClick={() => onDelete(snippet.id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    aria-label={`Delete snippet: ${snippet.name}`}
                >
                    Delete
                </button>
            </div>
        </div>
    );
});

// --- Main Component ---
/**
 * @component ClipboardSnippetInserter
 * @description The main component for the Snippet Vault application.
 * It integrates snippet management, search, add, copy, and delete functionalities.
 * Wraps its content with `SnippetProvider` to manage global snippet state.
 * Optimized with `React.memo` to prevent unnecessary re-renders.
 * @augments React.FC
 */
export const ClipboardSnippetInserter: React.FC = React.memo(() => {
    return (
        <SnippetProvider>
            <ClipboardSnippetInserterContent />
        </SnippetProvider>
    );
});

/**
 * @component ClipboardSnippetInserterContent
 * @description Internal component to consume SnippetContext and render the main UI.
 * Separated from `ClipboardSnippetInserter` to ensure `useSnippets` is called within the provider.
 */
const ClipboardSnippetInserterContent: React.FC = () => {
    const { snippets, loading, error, deleteSnippet } = useSnippets();
    const [feedback, setFeedback] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showAddForm, setShowAddForm] = useState<boolean>(false); // State to toggle add form visibility

    const handleCopy = useCallback(async (code: string): Promise<void> => {
        try {
            await navigator.clipboard.writeText(code);
            setFeedback('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            setFeedback('Failed to copy. Please try manually.');
        } finally {
            setTimeout(() => setFeedback(null), 2000);
        }
    }, []);

    const handleDelete = useCallback((id: string): void => {
        if (window.confirm("Are you sure you want to delete this snippet? This action cannot be undone.")) {
            deleteSnippet(id);
            setFeedback('Snippet deleted.');
            setTimeout(() => setFeedback(null), 2000);
        }
    }, [deleteSnippet]);

    const filteredSnippets = useMemo(() => {
        if (!searchTerm) {
            return snippets;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return snippets.filter(snippet =>
            snippet.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            snippet.code.toLowerCase().includes(lowerCaseSearchTerm) ||
            snippet.tags?.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }, [snippets, searchTerm]);

    // Handle loading and error states from the useSnippets hook
    if (loading) {
        return (
            <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 justify-center items-center text-slate-400 bg-slate-900 rounded-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4" role="status" aria-label="Loading snippets"></div>
                <p className="text-lg">Loading snippets...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 justify-center items-center text-red-400 bg-red-900/20 rounded-lg">
                <p className="font-bold text-lg mb-2">Error loading snippets:</p>
                <p className="text-md text-red-300">{error}</p>
                <p className="text-sm text-red-300 mt-2">Please check your browser settings or try again.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100">
            <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                 <h1 className="text-3xl font-bold text-slate-100 flex items-center mb-4 sm:mb-0">
                    <CodeBracketIcon className="h-8 w-8 text-cyan-500" aria-hidden="true" />
                    <span className="ml-3">Snippet Vault</span>
                </h1>
                <div className="flex items-center gap-4">
                    {feedback && (
                        <div className={`text-sm px-3 py-1 rounded-md ${feedback.includes('Copied') || feedback.includes('deleted') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`} role="status" aria-live="polite">
                            {feedback}
                        </div>
                    )}
                    <button
                        onClick={() => setShowAddForm(prev => !prev)}
                        className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                        aria-expanded={showAddForm}
                        aria-controls="add-snippet-section"
                    >
                        {showAddForm ? 'Hide Form' : 'Add New Snippet'}
                    </button>
                </div>
            </header>
            <p className="text-slate-400 -mt-4 mb-6">Manage and quickly copy your saved code snippets for efficient development.</p>
            
            <section id="add-snippet-section" aria-labelledby="add-snippet-heading" className={`transition-all duration-300 ease-in-out ${showAddForm ? 'max-h-screen opacity-100 mb-8' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                {showAddForm && <AddSnippetForm onSnippetAdded={() => setShowAddForm(false)} />}
            </section>

            <div className="mb-6">
                <label htmlFor="snippet-search" className="sr-only">Search Snippets</label>
                <input
                    id="snippet-search"
                    type="text"
                    placeholder="Search snippets by name, code, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 rounded-md bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    aria-label="Search snippets"
                />
            </div>

            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar" role="list">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredSnippets && filteredSnippets.length > 0 ? (
                        filteredSnippets.map((snippet: Snippet) => (
                            <SnippetCard key={snippet.id} snippet={snippet} onCopy={handleCopy} onDelete={handleDelete} />
                        ))
                    ) : (
                        <div className="col-span-full text-slate-500 h-64 flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-lg" role="alert">
                            <CodeBracketIcon className="h-10 w-10 text-slate-600 mb-4" aria-hidden="true" />
                            <p className="text-lg font-medium">No snippets found.</p>
                            {searchTerm && <p className="text-md text-slate-600">Try adjusting your search terms.</p>}
                            {!searchTerm && <p className="text-md text-slate-600">Start by adding a new snippet!</p>}
                        </div>
                    )}
                </div>
            </div>
            {/* Custom scrollbar styling for a better visual experience */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1e293b; /* slate-800 */
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #06b6d4; /* cyan-500 */
                    border-radius: 10px;
                    border: 2px solid #1e293b;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #0891b2; /* cyan-600 */
                }
            `}</style>
        </div>
    );
};