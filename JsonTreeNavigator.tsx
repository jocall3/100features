// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { FileCodeIcon } from '../icons/FeatureIcons.tsx';
// Assuming these additional icons exist in the same FeatureIcons.tsx file or a similar structure.
import { CopyIcon, DownloadIcon, UploadIcon, SearchIcon, ExpandIcon, CollapseIcon, ClipboardCheckIcon } from '../icons/FeatureIcons.tsx';

// --- Type Definitions ---
/**
 * Represents a primitive JSON value: string, number, boolean, or null.
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * Represents a JSON object, mapping string keys to JsonValue.
 */
export interface JsonObject {
    [key: string]: JsonValue;
}

/**
 * Represents a JSON array of JsonValue.
 */
export interface JsonArray extends Array<JsonValue> { }

/**
 * Represents any valid JSON value: a primitive, an object, or an array.
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

// --- Error Boundary Component ---
/**
 * Props for the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
    /** The children components to render. */
    children: React.ReactNode;
    /** Optional fallback UI to display when an error occurs. */
    fallback?: React.ReactNode;
}

/**
 * State for the ErrorBoundary component.
 */
interface ErrorBoundaryState {
    /** Indicates if an error has occurred. */
    hasError: boolean;
    /** The error object caught, if any. */
    error: Error | null;
}

/**
 * A React Error Boundary component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the entire application.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    /**
     * Updates state to show fallback UI when an error is caught.
     * @param error The error that was thrown.
     * @returns An object to update the component's state.
     */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    /**
     * Logs the error information. This is a good place to send error reports to an analytics service.
     * @param error The error that was thrown.
     * @param errorInfo An object with a `componentStack` key providing information about which component threw the error.
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 bg-red-900 text-red-100 rounded-md">
                    <h2 className="text-lg font-bold">Something went wrong.</h2>
                    <p className="mt-2 text-sm">{this.state.error?.message || 'An unknown error occurred.'}</p>
                    <p className="mt-1 text-xs text-red-200">The component failed to render correctly. Please check the JSON data.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

// --- Utility Functions ---
/**
 * Formats a JsonValue into a pretty-printed JSON string.
 * @param data The JSON data to format.
 * @returns A formatted JSON string, or an error message if stringification fails.
 */
const getFormattedJsonString = (data: JsonValue): string => {
    try {
        return JSON.stringify(data, null, 2);
    } catch (e) {
        return "Error: Could not stringify JSON.";
    }
};

/**
 * Copies a given text string to the clipboard.
 * @param text The string to copy.
 * @returns A Promise that resolves to true if successful, false otherwise.
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
};

/**
 * Checks if a given key or primitive value matches the filter term.
 * @param key The key of the JSON node.
 * @param value The value of the JSON node.
 * @param filterTerm The term to filter by.
 * @returns True if the key or value contains the filter term (case-insensitive), false otherwise.
 */
const doesMatchFilter = (key: string, value: JsonValue, filterTerm: string): boolean => {
    if (!filterTerm) return false;
    const lowerFilter = filterTerm.toLowerCase();

    if (key.toLowerCase().includes(lowerFilter)) {
        return true;
    }
    if (typeof value === 'string' && value.toLowerCase().includes(lowerFilter)) {
        return true;
    }
    if (typeof value === 'number' && String(value).includes(lowerFilter)) {
        return true;
    }
    if (typeof value === 'boolean' && String(value).toLowerCase().includes(lowerFilter)) {
        return true;
    }
    return false;
};

/**
 * Recursively checks if any descendant (key or primitive value) within a JSON subtree matches the filter term.
 * @param value The JSON value to check.
 * @param filterTerm The term to filter by.
 * @returns True if any descendant matches, false otherwise.
 */
const checkDescendantsForFilter = (value: JsonValue, filterTerm: string): boolean => {
    if (!filterTerm) return false;
    const lowerFilter = filterTerm.toLowerCase();

    if (typeof value === 'string' && value.toLowerCase().includes(lowerFilter)) {
        return true;
    }
    if (typeof value === 'number' && String(value).includes(lowerFilter)) {
        return true;
    }
    if (typeof value === 'boolean' && String(value).toLowerCase().includes(lowerFilter)) {
        return true;
    }
    if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
            return value.some((item) => checkDescendantsForFilter(item, filterTerm));
        } else {
            return Object.entries(value as JsonObject).some(([k, v]) => k.toLowerCase().includes(lowerFilter) || checkDescendantsForFilter(v, filterTerm));
        }
    }
    return false;
};

// --- JsonNode Component ---
/**
 * Props for the JsonNode component.
 */
interface JsonNodeProps {
    /** The JSON data for this node. */
    data: JsonValue;
    /** The key of this JSON node (e.g., property name or array index). */
    nodeKey: string;
    /** If true, this node is the root of the JSON tree. */
    isRoot?: boolean;
    /** The full path to this node (e.g., "root.config.version"). */
    path: string;
    /** The current filter term to highlight/show matching nodes. */
    filterTerm: string;
    /** Controls the initial expanded state. `true` for expand all, `false` for collapse all. */
    defaultExpanded?: boolean;
    /** Callback when a node's expanded state changes. */
    onNodeToggle?: (path: string, isOpen: boolean) => void;
}

/**
 * A recursive component to render a single node in a JSON tree.
 * Supports expanding/collapsing, copying path/value, and filtering.
 */
export const JsonNode: React.FC<JsonNodeProps> = React.memo(({
    data,
    nodeKey,
    isRoot = false,
    path,
    filterTerm,
    defaultExpanded,
    onNodeToggle
}) => {
    const [isOpen, setIsOpen] = useState(isRoot || (defaultExpanded === true));
    const [showCopied, setShowCopied] = useState(false);

    // Effect to update isOpen state when defaultExpanded changes (e.g., from expand all/collapse all buttons)
    useEffect(() => {
        if (defaultExpanded !== undefined) {
            setIsOpen(defaultExpanded);
        }
    }, [defaultExpanded]);

    // Effect to auto-expand nodes that contain a matching filter term
    useEffect(() => {
        if (filterTerm && (selfMatchesFilter || descendantsMatchFilter)) {
            setIsOpen(true);
        } else if (!filterTerm && defaultExpanded === undefined) {
            setIsOpen(isRoot); // Reset to default if filter is cleared and no global expand/collapse
        } else if (!filterTerm && defaultExpanded !== undefined) {
            setIsOpen(defaultExpanded); // Reset to global expand/collapse if filter is cleared
        }
    }, [filterTerm, selfMatchesFilter, descendantsMatchFilter, isRoot, defaultExpanded]);

    const isObject = typeof data === 'object' && data !== null;
    const isArray = Array.isArray(data);

    /**
     * Toggles the open/closed state of the node.
     */
    const toggleOpen = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(prev => {
            const newState = !prev;
            onNodeToggle?.(path, newState);
            return newState;
        });
    }, [path, onNodeToggle]);

    /**
     * Copies the node's path to the clipboard and shows a feedback icon.
     */
    const handleCopyPath = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        const success = await copyToClipboard(path);
        if (success) {
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 1500);
        }
    }, [path]);

    /**
     * Copies the node's value (formatted if object/array) to the clipboard and shows a feedback icon.
     */
    const handleCopyValue = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        const valueToCopy = typeof data === 'object' ? getFormattedJsonString(data) : String(data);
        const success = await copyToClipboard(valueToCopy);
        if (success) {
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 1500);
        }
    }, [data]);

    // Determine if this node's key or primitive value directly matches the filter term.
    const selfMatchesFilter = useMemo(() => {
        return doesMatchFilter(nodeKey, data, filterTerm);
    }, [nodeKey, data, filterTerm]);

    // Determine if any of this node's descendants match the filter term.
    const descendantsMatchFilter = useMemo(() => {
        if (!filterTerm || !isObject) return false;
        return checkDescendantsForFilter(data, filterTerm);
    }, [data, filterTerm, isObject]);

    // Decides if this node should be rendered at all based on the filter.
    const shouldRenderNode = useMemo(() => {
        if (isRoot) return true; // Always render the root
        if (!filterTerm) return true; // No filter, render everything
        return selfMatchesFilter || descendantsMatchFilter;
    }, [isRoot, filterTerm, selfMatchesFilter, descendantsMatchFilter]);

    if (!shouldRenderNode) {
        return null;
    }

    if (!isObject) {
        // Render primitive values
        const valueClassName = typeof data === 'string' ? 'text-green-400' : (typeof data === 'number' ? 'text-orange-400' : (typeof data === 'boolean' ? 'text-blue-400' : 'text-slate-500'));
        const formattedValue = typeof data === 'string' ? `"${data}"` : String(data);
        return (
            <div className={`ml-4 pl-4 border-l border-slate-700 flex items-center group ${selfMatchesFilter ? 'bg-yellow-900/30 rounded-sm' : ''}`}>
                <span className="text-purple-400">{nodeKey}: </span>
                <span className={`ml-1 ${valueClassName}`}>{formattedValue}</span>
                <button
                    onClick={handleCopyValue}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded"
                    aria-label={`Copy value of ${nodeKey}`}
                    title="Copy Value"
                >
                    {showCopied ? <ClipboardCheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                </button>
            </div>
        );
    }

    const entries = Object.entries(data as JsonObject);
    const bracket = isArray ? '[]' : '{}';
    const numChildren = entries.length;

    // Filter children for rendering: only show children that themselves match or have matching descendants.
    const filteredEntries = useMemo(() => {
        if (!filterTerm) return entries;
        return entries.filter(([childKey, childValue]) => {
            return doesMatchFilter(childKey, childValue, filterTerm) || checkDescendantsForFilter(childValue, filterTerm);
        });
    }, [entries, filterTerm]);

    const hasChildren = filteredEntries.length > 0; // Use filteredEntries length for actual rendering logic

    return (
        <div className={`ml-4 ${!isRoot ? 'pl-4 border-l border-slate-700' : ''} ${selfMatchesFilter ? 'bg-yellow-900/30 rounded-sm' : ''}`}>
            <div className="flex items-center group">
                <button
                    onClick={toggleOpen}
                    className={`flex items-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded py-1 ${!numChildren ? 'cursor-default text-slate-600' : ''}`}
                    aria-expanded={isOpen}
                    aria-controls={path.replace(/\./g, '-')}
                    disabled={!numChildren} // Disable toggle if no children exist in original data
                >
                    {numChildren > 0 && <span className={`transform transition-transform ${isOpen ? 'rotate-90' : 'rotate-0'} text-slate-500`}>&#9658;</span>}
                    {!numChildren && <span className="w-4 text-slate-600 inline-block text-center">-</span>} {/* Placeholder for alignment */}
                    <span className="ml-1 text-purple-400">{nodeKey}:</span>
                    <span className="ml-2 text-slate-500">{bracket[0]}</span>
                    {!isOpen && numChildren > 0 && (
                        <span className="text-slate-500 ml-1">
                            ... {numChildren} {isArray ? 'items' : 'keys'}{bracket[1]}
                        </span>
                    )}
                    {!isOpen && numChildren === 0 && ( // Display empty brackets if no children and collapsed
                        <span className="text-slate-500 ml-1">{bracket[1]}</span>
                    )}
                </button>
                <button
                    onClick={handleCopyPath}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded"
                    aria-label={`Copy path to ${nodeKey}`}
                    title="Copy Path"
                >
                    {showCopied ? <ClipboardCheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                </button>
                <button
                    onClick={handleCopyValue}
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded"
                    aria-label={`Copy value of ${nodeKey}`}
                    title="Copy Value"
                >
                    {showCopied ? <ClipboardCheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                </button>
            </div>

            {isOpen && (
                <div id={path.replace(/\./g, '-')}>
                    {hasChildren ? (
                        filteredEntries.map(([key, value], index) => (
                            <JsonNode
                                key={Array.isArray(data) ? index : key} // Use index for array keys to avoid conflicts with string keys
                                nodeKey={Array.isArray(data) ? String(index) : key} // Display index for array items
                                data={value}
                                path={`${path}.${Array.isArray(data) ? index : key}`}
                                filterTerm={filterTerm}
                                defaultExpanded={defaultExpanded}
                                onNodeToggle={onNodeToggle}
                            />
                        ))
                    ) : (
                        numChildren > 0 && <div className="text-slate-500 ml-4 italic">No matching children.</div>
                    )}
                    <div className="text-slate-500 ml-4">{bracket[1]}</div>
                </div>
            )}
        </div>
    );
});

// --- JsonTreeNavigator Component ---
/**
 * Props for the JsonTreeNavigator component.
 */
interface JsonTreeNavigatorProps {
    /** Optional initial JSON data to display. If provided, the component acts as a viewer; otherwise, it provides an input area. */
    initialData?: JsonValue;
    /** Callback function triggered when the parsed JSON data changes or an error occurs. */
    onDataChange?: (data: JsonValue | null, error: string) => void;
}

/**
 * A comprehensive JSON Tree Navigator component.
 * It allows users to paste, upload, or receive JSON data, visualize it as a collapsible tree,
 * search/filter nodes, expand/collapse the entire tree, and copy/download the data.
 * It's designed to be production-ready with error boundaries, accessibility, and performance optimizations.
 */
export const JsonTreeNavigator: React.FC<JsonTreeNavigatorProps> = ({ initialData, onDataChange }) => {
    const defaultJson = '{\n  "id": "devcore-001",\n  "active": true,\n  "features": [\n    "ai-explainer",\n    "api-tester"\n  ],\n  "config": {\n    "theme": "dark",\n    "version": 1\n  }\n}';
    const [jsonInput, setJsonInput] = useState(initialData ? getFormattedJsonString(initialData) : defaultJson);
    const [parsedData, setParsedData] = useState<JsonValue | null>(initialData || null);
    const [error, setError] = useState('');
    const [filterTerm, setFilterTerm] = useState('');
    const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined); // undefined: neutral, true: expand, false: collapse
    const [isCopyingAll, setIsCopyingAll] = useState(false);
    const [isFileLoading, setIsFileLoading] = useState(false);

    // Effect to synchronize internal state with initialData prop changes.
    useEffect(() => {
        if (initialData !== undefined && initialData !== parsedData) {
            setJsonInput(getFormattedJsonString(initialData));
            setParsedData(initialData);
            setError('');
            setExpandAll(undefined); // Reset expand/collapse state
        }
    }, [initialData, parsedData]);

    /**
     * Parses the JSON input string and updates the parsedData state.
     * Also handles error reporting for invalid JSON.
     */
    const parseJson = useCallback(() => {
        try {
            const parsed = JSON.parse(jsonInput) as JsonValue;
            setParsedData(parsed);
            setError('');
            onDataChange?.(parsed, '');
            setExpandAll(undefined); // Reset expand/collapse state after new parse
        } catch (e) {
            if (e instanceof Error) setError(e.message);
            setParsedData(null);
            onDataChange?.(null, e instanceof Error ? e.message : 'Unknown parsing error');
        }
    }, [jsonInput, onDataChange]);

    // Initial parse when component mounts, either for initialData or the default value.
    useEffect(() => {
        // Only parse if jsonInput has content or if initialData is provided
        if (jsonInput || initialData) {
            parseJson();
        }
    }, [jsonInput, initialData, parseJson]); // Depend on jsonInput to re-parse when text area content changes

    /**
     * Handles file selection for JSON upload, reads the file content, and updates the input.
     * @param event The change event from the file input.
     */
    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsFileLoading(true);
            setError('');
            try {
                const text = await file.text();
                setJsonInput(text); // This will trigger the parseJson via useEffect
                setIsFileLoading(false);
                event.target.value = ''; // Clear file input value to allow re-uploading the same file
            } catch (e) {
                setIsFileLoading(false);
                if (e instanceof Error) setError(`Failed to read file: ${e.message}`);
                setParsedData(null);
                onDataChange?.(null, e instanceof Error ? e.message : 'Failed to read file');
            }
        }
    }, [onDataChange]);

    /**
     * Copies the entire parsed JSON data to the clipboard.
     */
    const handleCopyAll = useCallback(async () => {
        if (parsedData) {
            setIsCopyingAll(true);
            const success = await copyToClipboard(getFormattedJsonString(parsedData));
            if (!success) {
                setError('Failed to copy JSON to clipboard.');
            }
            setTimeout(() => setIsCopyingAll(false), 1500);
        }
    }, [parsedData]);

    /**
     * Triggers a download of the current parsed JSON data as a `.json` file.
     */
    const handleDownloadJson = useCallback(() => {
        if (parsedData) {
            const jsonString = getFormattedJsonString(parsedData);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `json-data-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }, [parsedData]);

    /**
     * Sets the global expand state to true, causing all nodes to expand.
     */
    const handleExpandAll = useCallback(() => {
        setExpandAll(true);
    }, []);

    /**
     * Sets the global expand state to false, causing all nodes to collapse.
     */
    const handleCollapseAll = useCallback(() => {
        setExpandAll(false);
    }, []);

    // If initialData is provided and jsonInput is aligned with it, render in view-only mode.
    // The conditional rendering ensures that if `initialData` changes, the `useEffect` above
    // correctly updates `jsonInput` and `parsedData` before this branch is taken.
    if (initialData && jsonInput === getFormattedJsonString(initialData) && parsedData === initialData) {
        return (
            <div className="font-mono text-sm h-full overflow-y-auto p-4 bg-slate-800/50 border border-slate-700/50 rounded-md">
                <ErrorBoundary fallback={<div className="text-red-400 p-4">Error rendering JSON tree.</div>}>
                    <JsonNode data={initialData} nodeKey="root" isRoot path="root" filterTerm={filterTerm} defaultExpanded={true} />
                </ErrorBoundary>
            </div>
        );
    }

    // Standalone mode with textarea for input and controls.
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <FileCodeIcon className="w-8 h-8 text-cyan-500" />
                    <span className="ml-3">JSON Tree Navigator</span>
                </h1>
                <p className="text-slate-400 mt-1">Paste, upload, or manually enter JSON data to visualize it as a collapsible tree. Search and navigate easily.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                {/* Left Panel: JSON Input & Controls */}
                <div className="flex flex-col h-full bg-slate-800 rounded-lg shadow-lg">
                    <div className="p-4 border-b border-slate-700 flex flex-wrap gap-2 items-center justify-between">
                        <label htmlFor="json-input" className="text-sm font-medium text-slate-400">JSON Input</label>
                        <div className="flex flex-wrap gap-2">
                            <label className="relative flex items-center px-4 py-2 bg-slate-700 text-slate-100 font-bold rounded-md hover:bg-slate-600 cursor-pointer text-sm transition-colors">
                                <UploadIcon className="w-4 h-4 mr-2" />
                                {isFileLoading ? 'Uploading...' : 'Upload JSON'}
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    disabled={isFileLoading}
                                    aria-label="Upload JSON file"
                                />
                            </label>
                            <button
                                onClick={parseJson}
                                className="px-4 py-2 bg-cyan-600 text-slate-900 font-bold rounded-md hover:bg-cyan-500 text-sm transition-colors"
                                aria-label="Render JSON Tree"
                                title="Render Tree"
                            >
                                Render Tree
                            </button>
                        </div>
                    </div>
                    <textarea
                        id="json-input"
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className={`flex-grow p-4 bg-slate-900 border-none rounded-b-lg resize-none font-mono text-sm text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500 ${error ? 'border-red-500' : ''}`}
                        placeholder="Paste your JSON here or upload a file..."
                        aria-invalid={!!error}
                        aria-describedby={error ? 'json-input-error' : undefined}
                    />
                    {error && <p id="json-input-error" role="alert" className="text-red-400 text-xs mt-1 p-2 bg-red-900/20 rounded-b-lg">{error}</p>}
                </div>

                {/* Right Panel: Tree View & Controls */}
                <div className="flex flex-col h-full bg-slate-800 rounded-lg shadow-lg">
                    <div className="p-4 border-b border-slate-700 flex flex-wrap gap-2 items-center justify-between">
                        <label className="text-sm font-medium text-slate-400">Tree View</label>
                        <div className="flex flex-wrap gap-2 items-center">
                            {/* Search Input */}
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search key/value..."
                                    value={filterTerm}
                                    onChange={(e) => setFilterTerm(e.target.value)}
                                    className="pl-9 pr-3 py-1 bg-slate-700 border border-slate-600 rounded-md text-slate-100 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 w-40 transition-colors"
                                    aria-label="Search JSON tree"
                                />
                            </div>
                            {/* Expand/Collapse All */}
                            <button
                                onClick={handleExpandAll}
                                className="p-2 bg-slate-700 text-slate-100 rounded-md hover:bg-slate-600 text-sm flex items-center transition-colors"
                                aria-label="Expand all nodes"
                                title="Expand All"
                            >
                                <ExpandIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCollapseAll}
                                className="p-2 bg-slate-700 text-slate-100 rounded-md hover:bg-slate-600 text-sm flex items-center transition-colors"
                                aria-label="Collapse all nodes"
                                title="Collapse All"
                            >
                                <CollapseIcon className="w-4 h-4" />
                            </button>
                            {/* Copy All */}
                            <button
                                onClick={handleCopyAll}
                                className="p-2 bg-slate-700 text-slate-100 rounded-md hover:bg-slate-600 text-sm flex items-center transition-colors"
                                aria-label="Copy entire JSON to clipboard"
                                title="Copy All JSON"
                            >
                                {isCopyingAll ? <ClipboardCheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            </button>
                            {/* Download */}
                            <button
                                onClick={handleDownloadJson}
                                className="p-2 bg-slate-700 text-slate-100 rounded-md hover:bg-slate-600 text-sm flex items-center transition-colors"
                                aria-label="Download JSON file"
                                title="Download JSON"
                            >
                                <DownloadIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-grow p-4 bg-slate-900 border-none rounded-b-lg overflow-y-auto font-mono text-sm">
                        {parsedData ? (
                            <ErrorBoundary fallback={<div className="text-red-400 p-2">Error rendering JSON tree. The data might be too complex or malformed for visualization.</div>}>
                                <JsonNode
                                    data={parsedData}
                                    nodeKey="root"
                                    isRoot
                                    path="root"
                                    filterTerm={filterTerm}
                                    defaultExpanded={expandAll}
                                />
                            </ErrorBoundary>
                        ) : (
                            <div className="text-slate-500 p-2">
                                {error ? 'Please correct the JSON input to render the tree.' : 'Click "Render Tree" to view or upload a JSON file.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};