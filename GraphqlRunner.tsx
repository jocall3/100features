// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ServerIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';
import { JsonTreeNavigator } from './JsonTreeNavigator.tsx';
import { v4 as uuidv4 } from 'uuid'; // Standard utility for unique IDs

// Type Definitions
// ==============================================================================

/**
 * Represents a single item in the GraphQL query history.
 * @property {string} id - A unique identifier for the history item.
 * @property {number} timestamp - The time when the query was saved/executed.
 * @property {string} endpoint - The GraphQL API endpoint used.
 * @property {string} query - The GraphQL query string.
 * @property {string} variables - The JSON string of variables.
 * @property {string} headers - The JSON string of request headers.
 * @property {string} [name] - Optional user-defined name for the saved query/snippet.
 */
export interface GraphQLQueryHistoryItem {
    id: string;
    timestamp: number;
    endpoint: string;
    query: string;
    variables: string;
    headers: string; // Stored as stringified JSON
    name?: string;
}

/**
 * Props for the QueryHistoryPanel component.
 */
interface QueryHistoryPanelProps {
    history: GraphQLQueryHistoryItem[];
    onSelect: (item: GraphQLQueryHistoryItem) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, newName: string) => void;
}

/**
 * Props for the HeadersEditor component.
 */
interface HeadersEditorProps {
    headers: string;
    onChange: (newHeaders: string) => void;
    error: string;
}

// Constants and Defaults
// ==============================================================================

const defaultQuery = `query {
  character(id: 1) {
    name
    status
    species
    image
  }
}`;

const defaultVariables = `{
  "id": 1
}`;

const defaultHeaders = `{
  "Content-Type": "application/json"
}`;

const LOCAL_STORAGE_ENDPOINT_KEY = 'graphql_runner_endpoint';
const LOCAL_STORAGE_QUERY_KEY = 'graphql_runner_query';
const LOCAL_STORAGE_VARIABLES_KEY = 'graphql_runner_variables';
const LOCAL_STORAGE_HEADERS_KEY = 'graphql_runner_headers';
const LOCAL_STORAGE_HISTORY_KEY = 'graphql_runner_query_history';
const MAX_HISTORY_ITEMS = 50; // Limit the number of saved history items

// Helper Components
// ==============================================================================

/**
 * Renders a panel to display and manage GraphQL query history.
 * Allows users to select, delete, and rename historical queries.
 */
export const QueryHistoryPanel: React.FC<QueryHistoryPanelProps> = React.memo(({ history, onSelect, onDelete, onRename }) => {
    const [filter, setFilter] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string>('');

    const filteredHistory = useMemo(() => {
        return history.filter(item =>
            item.query.toLowerCase().includes(filter.toLowerCase()) ||
            item.endpoint.toLowerCase().includes(filter.toLowerCase()) ||
            (item.name && item.name.toLowerCase().includes(filter.toLowerCase()))
        ).sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
    }, [history, filter]);

    const handleEditClick = (item: GraphQLQueryHistoryItem) => {
        setEditingId(item.id);
        setEditingName(item.name || `Query from ${new Date(item.timestamp).toLocaleString()}`);
    };

    const handleSaveRename = (id: string) => {
        if (editingName.trim()) {
            onRename(id, editingName.trim());
        }
        setEditingId(null);
        setEditingName('');
    };

    const handleCancelRename = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleClearAllHistory = () => {
        if (window.confirm('Are you sure you want to clear all query history? This action cannot be undone.')) {
            localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
            // A simple way to trigger a re-render of the parent component to reflect cleared history
            // In a larger app, this would be managed by global state or a direct call to setQueryHistory in parent.
            window.location.reload(); 
        }
    };

    return (
        <div className="flex flex-col h-full">
            <input
                type="text"
                placeholder="Filter history by query, endpoint or name..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 mb-3 rounded-md bg-slate-800 border border-slate-700 font-mono text-sm focus:outline-none focus:border-cyan-500"
                aria-label="Filter query history"
            />
            <div className="flex-grow overflow-y-auto border border-slate-700 rounded-md p-2 bg-slate-900">
                {filteredHistory.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">No history or no matching queries.</p>
                ) : (
                    <ul className="space-y-2">
                        {filteredHistory.map((item) => (
                            <li key={item.id} className="p-3 bg-slate-800 rounded-md border border-slate-700 hover:border-cyan-500 transition-colors duration-200">
                                <div className="flex flex-col">
                                    {editingId === item.id ? (
                                        <div className="flex items-center gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="flex-grow px-2 py-1 bg-slate-700 border border-slate-600 rounded-md text-sm focus:outline-none focus:border-cyan-500"
                                                aria-label={`Edit name for query ${item.id}`}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveRename(item.id);
                                                    if (e.key === 'Escape') handleCancelRename();
                                                }}
                                            />
                                            <button
                                                onClick={() => handleSaveRename(item.id)}
                                                className="text-green-400 hover:text-green-300 text-sm"
                                                title="Save name"
                                                aria-label="Save query name"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancelRename}
                                                className="text-slate-400 hover:text-slate-300 text-sm"
                                                title="Cancel rename"
                                                aria-label="Cancel renaming query"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start mb-2">
                                            <h3
                                                className="text-cyan-400 font-semibold text-base break-all cursor-pointer hover:underline"
                                                onClick={() => onSelect(item)}
                                                title="Click to load this query"
                                            >
                                                {item.name || `Query from ${new Date(item.timestamp).toLocaleTimeString()}`}
                                            </h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditClick(item)}
                                                    className="text-slate-400 hover:text-slate-300 text-sm"
                                                    title="Rename query"
                                                    aria-label={`Rename query ${item.name || item.id}`}
                                                >
                                                    Rename
                                                </button>
                                                <button
                                                    onClick={() => onDelete(item.id)}
                                                    className="text-red-400 hover:text-red-300 text-sm"
                                                    title="Delete query"
                                                    aria-label={`Delete query ${item.name || item.id}`}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-slate-300 text-xs font-mono mb-1 truncate cursor-pointer" onClick={() => onSelect(item)}>
                                        <span className="text-slate-500">Endpoint: </span>{item.endpoint}
                                    </p>
                                    <p className="text-slate-400 text-xs font-mono truncate cursor-pointer" onClick={() => onSelect(item)}>
                                        <span className="text-slate-500">Query: </span>{item.query.split('\n')[0].substring(0, 80)}{item.query.split('\n')[0].length > 80 ? '...' : ''}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <button
                onClick={handleClearAllHistory}
                className="mt-4 px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-500 disabled:bg-red-800 transition-colors duration-200"
                aria-label="Clear all query history"
            >
                Clear All History
            </button>
        </div>
    );
});


/**
 * Renders an editor for GraphQL request headers, ensuring valid JSON input.
 */
export const HeadersEditor: React.FC<HeadersEditorProps> = React.memo(({ headers, onChange, error }) => {
    return (
        <div className="flex flex-col flex-1">
            <label htmlFor="headers-textarea" className="text-sm font-medium text-slate-400 mb-2">Headers (JSON)</label>
            <textarea
                id="headers-textarea"
                value={headers}
                onChange={e => onChange(e.target.value)}
                className={`flex-grow p-4 bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-md resize-none font-mono text-sm focus:outline-none ${error ? 'focus:border-red-500' : 'focus:border-cyan-500'}`}
                placeholder={`e.g., ${JSON.stringify({ Authorization: "Bearer YOUR_TOKEN" }, null, 2)}`}
                aria-label="GraphQL request headers in JSON format"
                aria-invalid={!!error}
                aria-describedby={error ? 'headers-error' : undefined}
            />
            {error && <p id="headers-error" role="alert" className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
    );
});


// Main Component
// ==============================================================================

export const GraphqlRunner: React.FC = () => {
    // State for GraphQL runner inputs and outputs, initialized from Local Storage
    const [endpoint, setEndpoint] = useState<string>(() => localStorage.getItem(LOCAL_STORAGE_ENDPOINT_KEY) || 'https://rickandmortyapi.com/graphql');
    const [query, setQuery] = useState<string>(() => localStorage.getItem(LOCAL_STORAGE_QUERY_KEY) || defaultQuery);
    const [variables, setVariables] = useState<string>(() => localStorage.getItem(LOCAL_STORAGE_VARIABLES_KEY) || defaultVariables);
    const [headers, setHeaders] = useState<string>(() => localStorage.getItem(LOCAL_STORAGE_HEADERS_KEY) || defaultHeaders);
    
    // State for request status and response
    const [response, setResponse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [headersError, setHeadersError] = useState<string>(''); // Specific error for headers JSON parsing

    // State for query history management
    const [queryHistory, setQueryHistory] = useState<GraphQLQueryHistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState<boolean>(false); // Toggles visibility of the history panel

    // --- Persistence Effects ---
    // Persist current runner state to Local Storage whenever inputs change
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_ENDPOINT_KEY, endpoint);
    }, [endpoint]);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_QUERY_KEY, query);
    }, [query]);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_VARIABLES_KEY, variables);
    }, [variables]);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_HEADERS_KEY, headers);
    }, [headers]);

    // Load query history from Local Storage on component mount
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
            if (storedHistory) {
                setQueryHistory(JSON.parse(storedHistory) as GraphQLQueryHistoryItem[]);
            }
        } catch (e) {
            console.error("Failed to load query history from local storage. It might be corrupted.", e);
            // Optionally, clear corrupted history to prevent future issues
            localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
            setQueryHistory([]); // Reset history if corrupted
        }
    }, []);

    // Save query history to Local Storage whenever it changes
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(queryHistory));
    }, [queryHistory]);

    // --- Input Handlers ---
    /**
     * Handles changes to the headers input, validating the JSON format.
     * @param {string} newHeaders - The new headers string.
     */
    const handleHeadersChange = useCallback((newHeaders: string) => {
        setHeaders(newHeaders);
        try {
            if (newHeaders.trim()) {
                JSON.parse(newHeaders);
            }
            setHeadersError(''); // Clear error if valid JSON
        } catch (e) {
            setHeadersError('Invalid JSON in headers.'); // Set error if parsing fails
        }
    }, []);

    /**
     * Executes the GraphQL request to the specified endpoint with the current query, variables, and headers.
     * Handles loading, error states, and adds successful queries to history.
     */
    const handleSendRequest = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setResponse(null);
        setHeadersError(''); // Clear previous header error before new validation

        let parsedVariables: Record<string, any> = {};
        try {
            if (variables.trim()) {
                parsedVariables = JSON.parse(variables);
            }
        } catch (e) {
            setError('Invalid JSON in variables. Please correct it before sending.');
            setIsLoading(false);
            return;
        }

        let parsedHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        try {
            if (headers.trim()) {
                parsedHeaders = { ...parsedHeaders, ...JSON.parse(headers) };
            }
            if (headersError) { // Re-check headers validity just before sending
                setError('Invalid JSON in headers. Please correct it before sending.');
                setIsLoading(false);
                return;
            }
        } catch (e) {
            // This catch should ideally not be hit if handleHeadersChange correctly sets headersError
            // but provides a fallback for robustness.
            setHeadersError('Invalid JSON in headers.');
            setError('Invalid JSON in headers. Please correct it before sending.');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: parsedHeaders,
                body: JSON.stringify({ query, variables: parsedVariables }),
            });
            const data = await res.json();
            if (res.ok) {
                 setResponse(data);
                 // Add to history only on successful response
                 const newHistoryItem: GraphQLQueryHistoryItem = {
                     id: uuidv4(),
                     timestamp: Date.now(),
                     endpoint,
                     query,
                     variables,
                     headers,
                 };
                 // Add new item to the beginning and trim history to MAX_HISTORY_ITEMS
                 setQueryHistory(prev => [newHistoryItem, ...prev].slice(0, MAX_HISTORY_ITEMS));
            } else {
                // If the server responded with an error (e.g., 400, 500 status code)
                setError(data.errors ? JSON.stringify(data.errors, null, 2) : `Server responded with status ${res.status}: An unknown error occurred.`);
            }
        } catch (err) {
            // Network errors or issues fetching
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Request failed: ${errorMessage}. Please check the endpoint URL, your network connection, and browser console.`);
        } finally {
            setIsLoading(false);
        }
    }, [endpoint, query, variables, headers, headersError, setQueryHistory]); // setQueryHistory is stable, but queryHistory is a dependency if you were to spread directly. Here it is a updater function.

    // --- History Panel Handlers ---
    /**
     * Loads a selected history item's data into the runner's input fields.
     * @param {GraphQLQueryHistoryItem} item - The history item to load.
     */
    const handleSelectHistoryItem = useCallback((item: GraphQLQueryHistoryItem) => {
        setEndpoint(item.endpoint);
        setQuery(item.query);
        setVariables(item.variables);
        setHeaders(item.headers);
        setHeadersError(''); // Clear any previous header error when loading from history
        setResponse(null); // Clear previous response
        setError(''); // Clear previous error
        setShowHistory(false); // Close history panel after selection
    }, []);

    /**
     * Deletes a history item by its ID.
     * @param {string} id - The ID of the item to delete.
     */
    const handleDeleteHistoryItem = useCallback((id: string) => {
        setQueryHistory(prev => prev.filter(item => item.id !== id));
    }, []);

    /**
     * Renames a history item.
     * @param {string} id - The ID of the item to rename.
     * @param {string} newName - The new name for the item.
     */
    const handleRenameHistoryItem = useCallback((id: string, newName: string) => {
        setQueryHistory(prev => prev.map(item =>
            item.id === id ? { ...item, name: newName } : item
        ));
    }, []);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100 font-sans">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ServerIcon className="w-8 h-8 text-cyan-400" aria-hidden="true" />
                    <span className="ml-3">GraphQL Runner</span>
                </h1>
                <p className="text-slate-400 mt-1">Send queries and mutations to a GraphQL endpoint with custom variables, headers, and manage your query history.</p>
            </header>

            <div className="flex flex-wrap items-center gap-4 mb-4">
                <input
                    type="url" // Use type="url" for better semantic meaning and mobile keyboard on some devices
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="GraphQL Endpoint URL (e.g., https://rickandmortyapi.com/graphql)"
                    className="flex-grow px-4 py-2 rounded-md bg-slate-800 border border-slate-700 font-mono text-sm focus:outline-none focus:border-cyan-500 min-w-[200px]"
                    aria-label="GraphQL endpoint URL"
                    required
                />
                <div className="flex gap-2">
                    <button
                        onClick={handleSendRequest}
                        disabled={isLoading || !!headersError || !endpoint.trim() || !query.trim()} // Disable if headers are invalid or inputs are empty
                        className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors duration-200"
                        aria-label="Execute GraphQL query"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Execute'}
                    </button>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="px-4 py-2 bg-slate-700 text-slate-100 font-bold rounded-md hover:bg-slate-600 transition-colors duration-200"
                        aria-label={showHistory ? 'Hide query history panel' : 'Show query history panel'}
                    >
                        {showHistory ? 'Hide History' : 'Show History'}
                    </button>
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                {/* Input Area: Query, Variables, Headers */}
                <div className="flex flex-col gap-4 lg:col-span-2">
                    <div className="flex flex-col flex-1">
                        <label htmlFor="query-textarea" className="text-sm font-medium text-slate-400 mb-2">Query</label>
                        <textarea
                            id="query-textarea"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm focus:outline-none focus:border-cyan-500"
                            aria-label="GraphQL query or mutation"
                            placeholder="Enter your GraphQL query here..."
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col flex-1">
                            <label htmlFor="variables-textarea" className="text-sm font-medium text-slate-400 mb-2">Variables (JSON)</label>
                            <textarea
                                id="variables-textarea"
                                value={variables}
                                onChange={e => setVariables(e.target.value)}
                                className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm focus:outline-none focus:border-cyan-500"
                                placeholder={`e.g., ${defaultVariables}`}
                                aria-label="GraphQL query variables in JSON format"
                            />
                        </div>
                        <HeadersEditor
                            headers={headers}
                            onChange={handleHeadersChange}
                            error={headersError}
                        />
                    </div>
                </div>

                {/* Output / History Area */}
                <div className="flex flex-col lg:col-span-1">
                    {showHistory ? (
                        <div className="flex flex-col h-full">
                            <label className="text-sm font-medium text-slate-400 mb-2" id="query-history-label">Query History</label>
                            <QueryHistoryPanel
                                history={queryHistory}
                                onSelect={handleSelectHistoryItem}
                                onDelete={handleDeleteHistoryItem}
                                onRename={handleRenameHistoryItem}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <label className="text-sm font-medium text-slate-400 mb-2" id="response-label">Response</label>
                            <div
                                className="flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto"
                                aria-labelledby="response-label"
                                role="region"
                            >
                                {isLoading && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                                {error && <pre role="alert" className="text-red-400 whitespace-pre-wrap font-mono text-sm break-words">{error}</pre>}
                                {response && !isLoading && !error && <JsonTreeNavigator data={response} />}
                                {!isLoading && !response && !error && <div className="text-slate-500 h-full flex items-center justify-center text-center">Execute a query to see the response here.</div>}
                            </div>
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};