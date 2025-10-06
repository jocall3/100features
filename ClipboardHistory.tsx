// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

// This file implements a sophisticated Clipboard History feature for a React application.
// It tracks text copied to the clipboard, stores it persistently using localStorage,
// and provides a user interface to view, search, pin, delete, and copy items from the history.
// The component is designed with enterprise-grade best practices, including TypeScript for
// strong typing, useReducer for robust state management, memoization for performance,
// accessibility features, and basic error handling with an ErrorBoundary.

import React, { useState, useEffect, useCallback, useReducer, useRef } from 'react';
import { FileCodeIcon } from '../icons/FeatureIcons.tsx';

// --- Types and Interfaces ---

/**
 * Represents a single item stored in the clipboard history.
 */
export interface ClipboardItem {
    id: string; // Using string UUID or Date.now() for unique IDs
    text: string;
    timestamp: number;
    pinned: boolean;
    type: 'text' | 'json' | 'url' | 'code' | 'unknown'; // Categorize content
}

/**
 * Defines the shape of the entire clipboard state managed by the reducer.
 */
interface ClipboardState {
    history: ClipboardItem[];
    searchTerm: string;
    showPinnedOnly: boolean;
    error: string | null;
    permissionStatus: 'prompt' | 'granted' | 'denied';
}

/**
 * Defines the possible actions that can be dispatched to the clipboard reducer.
 */
type ClipboardAction =
    | { type: 'ADD_ITEM'; payload: ClipboardItem }
    | { type: 'DELETE_ITEM'; payload: string }
    | { type: 'PIN_ITEM'; payload: string }
    | { type: 'SET_HISTORY'; payload: ClipboardItem[] }
    | { type: 'CLEAR_HISTORY'; payload: 'all' | 'unpinned' }
    | { type: 'SET_SEARCH_TERM'; payload: string }
    | { type: 'TOGGLE_PINNED_ONLY' }
    | { type: 'SET_PERMISSION_STATUS'; payload: 'prompt' | 'granted' | 'denied' }
    | { type: 'SET_ERROR'; payload: string | null };

// --- Constants ---
const MAX_HISTORY_SIZE = 50; // Maximum number of items to keep in history (excluding pinned)
const LOCAL_STORAGE_KEY = 'clipboardHistoryApp';

// --- Helper Functions ---

/**
 * Attempts to determine the type of the clipboard content.
 * @param text The clipboard text.
 * @returns The categorized type of the content.
 */
export function determineClipboardItemType(text: string): ClipboardItem['type'] {
    if (!text || typeof text !== 'string') {
        return 'unknown';
    }
    try {
        JSON.parse(text);
        return 'json';
    } catch (e) {
        // Not JSON
    }
    if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('www.')) {
        try {
            new URL(text.includes('://') ? text : `https://${text}`);
            return 'url';
        } catch (e) {
            // Not a valid URL
        }
    }
    // Basic heuristic for code (e.g., contains common code keywords or multiple lines)
    if (text.includes('{') || text.includes(';') || text.includes('(') || text.includes(')') || text.split('\n').length > 1) {
        return 'code';
    }
    return 'text';
}

/**
 * Reducer function for managing the clipboard history state.
 * @param state The current clipboard state.
 * @param action The dispatched action.
 * @returns The new clipboard state.
 */
export const clipboardReducer = (state: ClipboardState, action: ClipboardAction): ClipboardState => {
    switch (action.type) {
        case 'ADD_ITEM': {
            // Add new item, ensuring no duplicates and respecting max size
            const newItem = action.payload;
            const existingItemIndex = state.history.findIndex(item => item.text === newItem.text);

            let newHistory = [...state.history];

            if (existingItemIndex !== -1) {
                // If item already exists, remove it to re-add at the top (unless pinned)
                newHistory = newHistory.filter(item => item.id !== newItem.id && item.text !== newItem.text);
            }

            newHistory = [newItem, ...newHistory];

            // Separate pinned from unpinned, then trim unpinned
            const pinnedItems = newHistory.filter(item => item.pinned);
            const unpinnedItems = newHistory.filter(item => !item.pinned);

            // Ensure unpinned history doesn't exceed MAX_HISTORY_SIZE
            const trimmedUnpinned = unpinnedItems.slice(0, MAX_HISTORY_SIZE - pinnedItems.length); // Adjust limit for pinned items

            return {
                ...state,
                history: [...pinnedItems, ...trimmedUnpinned].sort((a, b) => {
                    // Pinned items first, then by timestamp (newest first)
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    return b.timestamp - a.timestamp;
                }),
                error: null, // Clear any previous errors on successful action
            };
        }
        case 'DELETE_ITEM':
            return {
                ...state,
                history: state.history.filter(item => item.id !== action.payload),
            };
        case 'PIN_ITEM':
            return {
                ...state,
                history: state.history.map(item =>
                    item.id === action.payload ? { ...item, pinned: !item.pinned } : item
                ).sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    return b.timestamp - a.timestamp;
                }),
            };
        case 'SET_HISTORY':
            return {
                ...state,
                history: action.payload.sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    return b.timestamp - a.timestamp;
                }),
            };
        case 'CLEAR_HISTORY': {
            if (action.payload === 'all') {
                return { ...state, history: [] };
            } else { // 'unpinned'
                return { ...state, history: state.history.filter(item => item.pinned) };
            }
        }
        case 'SET_SEARCH_TERM':
            return { ...state, searchTerm: action.payload };
        case 'TOGGLE_PINNED_ONLY':
            return { ...state, showPinnedOnly: !state.showPinnedOnly };
        case 'SET_PERMISSION_STATUS':
            return { ...state, permissionStatus: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
};

// --- Exported Helper Components ---

/**
 * A memoized component for displaying a single clipboard item.
 * Improves performance by preventing unnecessary re-renders of list items.
 */
export const ClipboardItemCard: React.FC<{
    item: ClipboardItem;
    onCopy: (text: string) => void;
    onPin: (id: string) => void;
    onDelete: (id: string) => void;
    copyStatus: string | null; // ID of the item currently being copied
}> = React.memo(({ item, onCopy, onPin, onDelete, copyStatus }) => {
    const isCopied = copyStatus === item.id;
    const itemTypeIcon = (type: ClipboardItem['type']) => {
        switch (type) {
            case 'url': return '🔗';
            case 'json': return '{{}}';
            case 'code': return '👨‍💻';
            case 'text': return '📝';
            default: return '❓';
        }
    };

    return (
        <div className="bg-slate-800 p-3 rounded-md flex flex-col gap-2 shadow-sm hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                    <span aria-hidden="true">{itemTypeIcon(item.type)}</span>
                    <span className="sr-only">Type: {item.type}</span>
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPin(item.id)}
                        className={`text-xs p-1 rounded-md ${item.pinned ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                        aria-label={item.pinned ? "Unpin item" : "Pin item"}
                        title={item.pinned ? "Unpin item" : "Pin item"}
                    >
                        {item.pinned ? '📌 Unpin' : '📍 Pin'}
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="text-xs bg-red-700 hover:bg-red-600 text-white p-1 rounded-md"
                        aria-label="Delete item from history"
                        title="Delete item"
                    >
                        🗑️ Delete
                    </button>
                </div>
            </div>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap break-words max-h-24 overflow-hidden">{item.text}</pre>
            <div className="flex justify-end">
                <button
                    onClick={() => onCopy(item.text)}
                    className={`text-xs px-3 py-1 rounded-md flex-shrink-0 transition-colors duration-200 ${isCopied ? 'bg-green-600 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold'}`}
                    aria-live="polite"
                    aria-label={isCopied ? "Copied!" : "Copy item to clipboard"}
                    title="Copy to clipboard"
                >
                    {isCopied ? '✅ Copied!' : 'Copy'}
                </button>
            </div>
        </div>
    );
});


/**
 * Generic Error Boundary component to catch JavaScript errors anywhere in its child component tree.
 * Prevents the entire application from crashing and displays a fallback UI.
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, { hasError: boolean; error: Error | null }> {
    constructor(props: React.PropsWithChildren<{}>) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        // Update state so the next render shows the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="bg-red-900 text-white p-4 rounded-md shadow-md m-4">
                    <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
                    <p className="text-red-200 mb-2">
                        We're sorry, but an unexpected error occurred. Please try reloading the page.
                    </p>
                    {this.state.error && (
                        <details className="text-red-300 text-sm">
                            <summary className="cursor-pointer">Error Details</summary>
                            <pre className="mt-2 p-2 bg-red-800 rounded-md overflow-auto max-h-40">
                                {this.state.error.message}<br />
                                {this.state.error.stack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}


// --- Main ClipboardHistory Component ---

export const ClipboardHistory: React.FC = () => {
    const [state, dispatch] = useReducer(clipboardReducer, {
        history: [],
        searchTerm: '',
        showPinnedOnly: false,
        error: null,
        permissionStatus: 'prompt',
    });

    const [copyStatusId, setCopyStatusId] = useState<string | null>(null); // State for visual copy feedback
    const copyTimeoutRef = useRef<number | null>(null);

    const { history, searchTerm, showPinnedOnly, error, permissionStatus } = state;

    // Effect to load history from local storage on mount
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedHistory) {
                const parsedHistory: ClipboardItem[] = JSON.parse(storedHistory);
                dispatch({ type: 'SET_HISTORY', payload: parsedHistory });
            }
        } catch (e) {
            console.error("Failed to load clipboard history from local storage", e);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load history from storage.' });
        }
    }, []);

    // Effect to save history to local storage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save clipboard history to local storage", e);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to save history to storage.' });
        }
    }, [history]);

    /**
     * Checks the current permission status for clipboard-read.
     */
    const checkPermission = useCallback(async () => {
        if (!navigator.permissions) {
             dispatch({ type: 'SET_ERROR', payload: 'Clipboard API not supported in this browser.' });
             dispatch({ type: 'SET_PERMISSION_STATUS', payload: 'denied' });
             return;
        }
        try {
            const permission = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
            dispatch({ type: 'SET_PERMISSION_STATUS', payload: permission.state });
            permission.onchange = () => dispatch({ type: 'SET_PERMISSION_STATUS', payload: permission.state });
        } catch (e) {
             console.error("Clipboard permission query failed:", e);
             dispatch({ type: 'SET_ERROR', payload: 'Clipboard API not supported or permission could not be queried.' });
             dispatch({ type: 'SET_PERMISSION_STATUS', payload: 'denied' });
        }
    }, []);

    useEffect(() => {
        checkPermission();
    }, [checkPermission]);

    // Effect to read clipboard content when window gains focus
    useEffect(() => {
        const handleFocus = async () => {
            if (permissionStatus === 'granted') {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text && (history.length === 0 || history[0].text !== text)) {
                        const newItem: ClipboardItem = {
                            id: Date.now().toString(), // Simple unique ID for now
                            text,
                            timestamp: Date.now(),
                            pinned: false,
                            type: determineClipboardItemType(text),
                        };
                        dispatch({ type: 'ADD_ITEM', payload: newItem });
                    }
                } catch(err) {
                    console.error("Could not read from clipboard on focus", err);
                    // This error is common if clipboard is empty or app loses permission for a moment.
                    // No need to set global error unless persistent.
                }
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [permissionStatus, history]); // Depend on history to prevent adding same item multiple times immediately

    /**
     * Handles copying an item's text to the system clipboard.
     * Provides visual feedback on success.
     * @param text The text to copy.
     * @param id The ID of the item being copied (for UI feedback).
     */
    const handleCopyItem = useCallback((text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopyStatusId(id);
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
            copyTimeoutRef.current = window.setTimeout(() => {
                setCopyStatusId(null);
            }, 1500); // Show "Copied!" for 1.5 seconds
        }).catch(err => {
            console.error("Failed to copy text:", err);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to copy text to clipboard.' });
        });
    }, []);

    /**
     * Requests clipboard read permission from the user.
     */
    const requestPermission = async () => {
        try {
            await navigator.clipboard.readText(); // This will trigger the prompt
            checkPermission(); // Re-check permission status after prompt
        } catch (err) {
            console.error("Permission not granted by user:", err);
            dispatch({ type: 'SET_ERROR', payload: 'Permission was not granted.' });
            dispatch({ type: 'SET_PERMISSION_STATUS', payload: 'denied' });
        }
    };

    /**
     * Filters the history based on the search term and pinned status.
     */
    const filteredHistory = history.filter(item => {
        const matchesSearch = item.text.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPinned = showPinnedOnly ? item.pinned : true;
        return matchesSearch && matchesPinned;
    });

    /**
     * Handles the clearing of clipboard history.
     * @param scope 'all' to clear everything, 'unpinned' to clear only non-pinned items.
     */
    const handleClearHistory = useCallback((scope: 'all' | 'unpinned') => {
        if (window.confirm(`Are you sure you want to clear ${scope === 'all' ? 'all' : 'unpinned'} items from history?`)) {
            dispatch({ type: 'CLEAR_HISTORY', payload: scope });
        }
    }, []);

    return (
        <ErrorBoundary>
            <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100">
                <header className="mb-6 border-b border-slate-700 pb-4">
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <FileCodeIcon className="w-8 h-8 text-cyan-500" />
                        <span className="ml-3">Clipboard History</span>
                    </h1>
                    <p className="text-slate-400 mt-1">View, manage, and reuse items you've recently copied to your clipboard. Updates on window focus.</p>
                </header>

                {error && (
                    <div className="bg-red-700 text-white p-3 rounded-md mb-4" role="alert" aria-live="assertive">
                        Error: {error}
                    </div>
                )}
                
                {permissionStatus !== 'granted' ? (
                    <div className="flex-grow flex flex-col items-center justify-center bg-slate-800/50 rounded-lg p-8 text-center">
                        <p className="text-lg text-slate-300 mb-4">{error || "This feature requires permission to read from your clipboard."}</p>
                        {permissionStatus === 'prompt' && (
                            <button
                                onClick={requestPermission}
                                className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-all"
                                aria-label="Grant clipboard read permission"
                            >
                                Grant Permission
                            </button>
                        )}
                        {permissionStatus === 'denied' && (
                            <p className="text-red-300 mt-2">
                                Permission denied. Please check your browser settings to grant access.
                            </p>
                        )}
                    </div>
                ) : (
                    <main className="flex-grow flex flex-col">
                        {/* Controls Section */}
                        <section className="flex flex-col sm:flex-row gap-4 mb-6">
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={searchTerm}
                                onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
                                className="flex-grow p-2 rounded-md bg-slate-700 text-slate-100 border border-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                                aria-label="Search clipboard history"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => dispatch({ type: 'TOGGLE_PINNED_ONLY' })}
                                    className={`px-4 py-2 rounded-md transition-colors ${showPinnedOnly ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}
                                    aria-pressed={showPinnedOnly}
                                    aria-label={showPinnedOnly ? "Show all items" : "Show pinned items only"}
                                    title={showPinnedOnly ? "Show all items" : "Show pinned items only"}
                                >
                                    {showPinnedOnly ? 'Show All' : 'Show Pinned'}
                                </button>
                                <button
                                    onClick={() => handleClearHistory('unpinned')}
                                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md transition-colors"
                                    aria-label="Clear unpinned history items"
                                    title="Clear unpinned history"
                                >
                                    Clear Unpinned
                                </button>
                                <button
                                    onClick={() => handleClearHistory('all')}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
                                    aria-label="Clear all history items"
                                    title="Clear all history"
                                >
                                    Clear All
                                </button>
                            </div>
                        </section>

                        {/* History List */}
                        <section className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                            {filteredHistory.length > 0 ? (
                                <div role="list" aria-label="Clipboard History Items">
                                    {filteredHistory.map(item => (
                                        <ClipboardItemCard
                                            key={item.id}
                                            item={item}
                                            onCopy={(text) => handleCopyItem(text, item.id)}
                                            onPin={(id) => dispatch({ type: 'PIN_ITEM', payload: id })}
                                            onDelete={(id) => dispatch({ type: 'DELETE_ITEM', payload: id })}
                                            copyStatus={copyStatusId}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-slate-500 h-full flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-lg">
                                    <p className="text-lg mb-2">
                                        {searchTerm ? "No matching items found." : "Copy some text to start building your history..."}
                                    </p>
                                    {!searchTerm && (
                                        <p className="text-sm">
                                            Your clipboard history will appear here. Pinned items will always be at the top.
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>
                    </main>
                )}
            </div>
        </ErrorBoundary>
    );
};