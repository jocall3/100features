/**
 * @file EnvDiffTool.tsx
 * @description
 * This file contains the `EnvDiffTool` React component, designed to provide an enterprise-grade
 * solution for comparing two environment variable files (`.env`).
 *
 * Goal:
 * To offer a robust, maintainable, scalable, and production-ready tool for developers and operations
 * teams to visualize changes between different environment configurations (e.g., development vs. production).
 *
 * Features Include:
 * - Side-by-side comparison of two `.env` file contents.
 * - Intelligent diffing: highlights added, removed, and changed variables.
 * - Granular value diffing: identifies specific portions of values that have changed.
 * - File upload/download capabilities for `.env` content.
 * - Filtering and sorting of diff results by type (added, removed, changed, same) and key.
 * - Search functionality to quickly find variables.
 * - Toggle visibility for sensitive environment variables (e.g., API keys, secrets).
 * - "Apply Change" action to merge specific values from Environment B to Environment A.
 * - Copy to clipboard functionality for keys and values.
 * - Responsive UI using Tailwind CSS.
 * - Accessibility enhancements (ARIA attributes, semantic HTML).
 * - TypeScript for strong typing and improved code quality.
 * - Loading and error states for asynchronous operations.
 * - An exported `AppErrorBoundary` for robust error handling in a production environment.
 *
 * Dependencies:
 * - React (for component logic)
 * - @heroicons/react (for UI icons)
 *
 * Usage:
 * Integrate `EnvDiffTool` into your React application. The component is self-contained
 * for its core functionality. `AppErrorBoundary` can be used to wrap it for higher-level
 * error handling.
 *
 * Note:
 * This file is enhanced to meet the "enterprise-grade" requirements as a standalone component.
 * In a multi-file project, some helper functions, types, or the ErrorBoundary might reside in
 * separate utility or HOC files. For the purpose of this exercise, they are co-located.
 */
// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useMemo, useCallback } from 'react';
import { LockClosedIcon } from '../icons/FeatureIcons.tsx';
import { CloudArrowUpIcon, CloudArrowDownIcon, EyeIcon, EyeSlashIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'; // New standard icons

/**
 * @typedef {'added' | 'removed' | 'changed' | 'same'} DiffType
 * Represents the type of difference for an environment variable.
 */
export type DiffType = 'added' | 'removed' | 'changed' | 'same';

/**
 * @typedef {'added' | 'removed' | 'same'} ValueDiffPartType
 * Represents the type of difference for a part of an environment variable's value.
 */
export type ValueDiffPartType = 'added' | 'removed' | 'same';

/**
 * @interface ValueDiffPart
 * Defines a segment of a value with its difference type.
 */
export interface ValueDiffPart {
    text: string;
    type: ValueDiffPartType;
}

/**
 * @interface EnvEntryDiff
 * Represents a single environment variable entry's difference status.
 */
export interface EnvEntryDiff {
    key: string;
    valueA: string;
    valueB: string;
    type: DiffType;
    valueDiff?: { // Optional granular diff for 'changed' type values
        a: ValueDiffPart[];
        b: ValueDiffPart[];
    };
    isSensitive?: boolean; // Indicates if the key is considered sensitive
}

/**
 * @typedef {'all' | DiffType} FilterOption
 * Options for filtering the diff results.
 */
export type FilterOption = 'all' | DiffType;

/**
 * @typedef {'key-asc' | 'key-desc' | 'type-asc' | 'type-desc'} SortOption
 * Options for sorting the diff results.
 */
export type SortOption = 'key-asc' | 'key-desc' | 'type-asc' | 'type-desc';

/**
 * @constant {RegExp} SENSITIVE_KEYS_REGEX
 * Regular expression to identify sensitive environment variable keys.
 */
const SENSITIVE_KEYS_REGEX = /(API_KEY|SECRET|PASSWORD|TOKEN|AUTH|PRIVATE_KEY|CLIENT_SECRET|DB_URI|DB_CONNECTION_STRING|CONNECTION_STRING)/i;

/**
 * Parses a given string containing .env file content into a Map of key-value pairs.
 * It ignores comments (lines starting with #) and empty lines.
 *
 * @param {string} text The .env file content as a string.
 * @returns {Map<string, string>} A Map where keys are environment variable names and values are their corresponding strings.
 */
const parseEnv = (text: string): Map<string, string> => {
    const map = new Map<string, string>();
    text.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
                const key = trimmed.substring(0, eqIndex);
                const value = trimmed.substring(eqIndex + 1);
                map.set(key, value);
            }
        }
    });
    return map;
};

/**
 * Performs a basic character-level diff between two strings to highlight changes.
 * This simplified implementation finds common prefixes and suffixes and marks the middle parts as changed.
 * For a more advanced diff, a dedicated library (e.g., `diff-match-patch`) would be used.
 *
 * @param {string} text1 The first string to compare.
 * @param {string} text2 The second string to compare.
 * @returns {{a: ValueDiffPart[], b: ValueDiffPart[]}} An object containing arrays of diff parts for each string.
 */
const getCharacterDiff = (text1: string, text2: string): { a: ValueDiffPart[], b: ValueDiffPart[] } => {
    if (text1 === text2) {
        return {
            a: [{ text: text1, type: 'same' }],
            b: [{ text: text2, type: 'same' }]
        };
    }

    // Find common prefix
    let commonPrefix = 0;
    while (commonPrefix < text1.length && commonPrefix < text2.length && text1[commonPrefix] === text2[commonPrefix]) {
        commonPrefix++;
    }

    // Find common suffix
    let commonSuffix = 0;
    while (commonSuffix < text1.length - commonPrefix && commonSuffix < text2.length - commonPrefix &&
           text1[text1.length - 1 - commonSuffix] === text2[text2.length - 1 - commonSuffix]) {
        commonSuffix++;
    }

    const prefixText = text1.substring(0, commonPrefix);
    const middle1 = text1.substring(commonPrefix, text1.length - commonSuffix);
    const suffixText = text1.substring(text1.length - commonSuffix);

    const middle2 = text2.substring(commonPrefix, text2.length - commonSuffix);

    const diffA: ValueDiffPart[] = [];
    const diffB: ValueDiffPart[] = [];

    if (prefixText) {
        diffA.push({ text: prefixText, type: 'same' });
        diffB.push({ text: prefixText, type: 'same' });
    }

    if (middle1) {
        diffA.push({ text: middle1, type: 'removed' });
    }
    if (middle2) {
        diffB.push({ text: middle2, type: 'added' });
    }

    if (suffixText) {
        diffA.push({ text: suffixText, type: 'same' });
        diffB.push({ text: suffixText, type: 'same' });
    }

    return { a: diffA, b: diffB };
};

/**
 * @function copyToClipboard
 * Copies the given text to the user's clipboard. Provides console feedback.
 *
 * @param {string} text The text to copy.
 * @returns {Promise<void>} A promise that resolves when the text is copied.
 */
export const copyToClipboard = async (text: string): Promise<void> => {
    try {
        await navigator.clipboard.writeText(text);
        console.log('Copied to clipboard:', text); // For debugging/feedback, would use a toast in a real app
    } catch (err) {
        console.error('Failed to copy text: ', err);
        // In a real application, you might show a user-facing error notification here.
    }
};

/**
 * @component EnvDiffTool
 * A comprehensive React component for comparing and managing environment variables.
 * It provides a UI for inputting two .env files, visualizing differences, and applying actions.
 */
export const EnvDiffTool: React.FC = () => {
    const [envA, setEnvA] = useState<string>('API_KEY=123\nDB_HOST=localhost\nNODE_ENV=development\nNEW_FEATURE=false\nAWS_SECRET_ACCESS_KEY=verysecretkey1');
    const [envB, setEnvB] = useState<string>('API_KEY=456\nDB_HOST=localhost\nFEATURE_FLAG=true\nANOTHER_KEY=new value\nAWS_SECRET_ACCESS_KEY=newsecretkey2');
    const [filter, setFilter] = useState<FilterOption>('all');
    const [sort, setSort] = useState<SortOption>('key-asc');
    const [showSensitive, setShowSensitive] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * @function diff
     * Memoized calculation of the differences between envA and envB.
     * It uses `parseEnv` and `getCharacterDiff` to determine the type of change and granular value diffs.
     */
    const diff = useMemo<EnvEntryDiff[]>(() => {
        setError(null); // Clear previous errors on new diff calculation
        const mapA = parseEnv(envA);
        const mapB = parseEnv(envB);
        const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);
        const result: EnvEntryDiff[] = [];

        allKeys.forEach(key => {
            const valA = mapA.get(key) || '';
            const valB = mapB.get(key) || '';
            let type: DiffType;
            let valueDiff: { a: ValueDiffPart[]; b: ValueDiffPart[] } | undefined = undefined;

            if (mapA.has(key) && mapB.has(key)) {
                if (valA === valB) {
                    type = 'same';
                } else {
                    type = 'changed';
                    valueDiff = getCharacterDiff(valA, valB);
                }
            } else if (mapA.has(key)) {
                type = 'removed';
            } else { // mapB.has(key)
                type = 'added';
            }

            const isSensitive = SENSITIVE_KEYS_REGEX.test(key);

            result.push({ key, valueA: valA, valueB: valB, type, valueDiff, isSensitive });
        });
        return result;
    }, [envA, envB]);

    /**
     * @function filteredAndSortedDiff
     * Memoized array of diff results after applying current filter, search, and sort options.
     */
    const filteredAndSortedDiff = useMemo(() => {
        let currentDiff = diff;

        // 1. Filtering
        if (filter !== 'all') {
            currentDiff = currentDiff.filter(item => item.type === filter);
        }

        // 2. Searching
        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            currentDiff = currentDiff.filter(item =>
                item.key.toLowerCase().includes(lowerCaseQuery) ||
                item.valueA.toLowerCase().includes(lowerCaseQuery) ||
                item.valueB.toLowerCase().includes(lowerCaseQuery)
            );
        }

        // 3. Sorting
        currentDiff.sort((a, b) => {
            if (sort === 'key-asc') return a.key.localeCompare(b.key);
            if (sort === 'key-desc') return b.key.localeCompare(a.key);
            // Sort by type (added, removed, changed, same)
            const typeOrder: Record<DiffType, number> = { 'added': 1, 'removed': 2, 'changed': 3, 'same': 4 };
            if (sort === 'type-asc') return typeOrder[a.type] - typeOrder[b.type];
            if (sort === 'type-desc') return typeOrder[b.type] - typeOrder[a.type];
            return 0;
        });

        return currentDiff;
    }, [diff, filter, sort, searchQuery]);

    /**
     * @function getRowClass
     * Returns the appropriate Tailwind CSS classes for a diff row based on its type.
     *
     * @param {DiffType} type The type of difference ('added', 'removed', 'changed', 'same').
     * @returns {string} Tailwind CSS classes.
     */
    const getRowClass = (type: DiffType): string => {
        switch (type) {
            case 'added': return 'bg-green-500/10 hover:bg-green-500/20';
            case 'removed': return 'bg-red-500/10 hover:bg-red-500/20';
            case 'changed': return 'bg-yellow-500/10 hover:bg-yellow-500/20';
            default: return 'bg-slate-800/50 hover:bg-slate-700/50';
        }
    };

    /**
     * @function renderValueDiff
     * Renders an array of ValueDiffPart, applying specific styling for added, removed, or same parts.
     * Hides sensitive values if `showSensitive` is false.
     *
     * @param {ValueDiffPart[]} parts The array of value diff parts.
     * @param {boolean} isSensitive Indicates if the value is sensitive.
     * @returns {JSX.Element[]} An array of span elements representing the diff.
     */
    const renderValueDiff = (parts: ValueDiffPart[], isSensitive: boolean): JSX.Element[] => {
        if (isSensitive && !showSensitive) {
            return [<span key="sensitive" className="text-slate-500 italic">***********</span>];
        }
        return parts.map((part, index) => {
            let colorClass = '';
            if (part.type === 'added') colorClass = 'text-green-300 font-semibold';
            if (part.type === 'removed') colorClass = 'text-red-300 font-semibold line-through';
            return <span key={index} className={colorClass}>{part.text}</span>;
        });
    };

    /**
     * @function handleFileUpload
     * Handles uploading of an .env file, reading its content, and setting it to either envA or envB.
     * Includes loading and error states.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} event The file input change event.
     * @param {'A' | 'B'} target Specifies whether to update envA or envB.
     * @returns {Promise<void>}
     */
    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, target: 'A' | 'B'): Promise<void> => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        try {
            const text = await file.text();
            if (target === 'A') {
                setEnvA(text);
            } else {
                setEnvB(text);
            }
        } catch (err) {
            setError('Failed to read file. Please ensure it is a valid text file.');
            console.error('File upload error:', err);
        } finally {
            setLoading(false);
            event.target.value = ''; // Clear file input value to allow re-uploading the same file
        }
    }, []);

    /**
     * @function handleDownloadEnv
     * Triggers a download of the provided environment content as a .env file.
     *
     * @param {string} envContent The content of the .env file to download.
     * @param {string} fileName The desired filename for the downloaded file.
     */
    const handleDownloadEnv = useCallback((envContent: string, fileName: string): void => {
        const blob = new Blob([envContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }, []);

    /**
     * @function applyChange
     * Applies a specific change from Environment B to Environment A for a given key.
     * This updates the `envA` state.
     *
     * @param {string} key The key of the environment variable to change.
     * @param {string} valueB The value from Environment B to apply to Environment A.
     */
    const applyChange = useCallback((key: string, valueB: string): void => {
        setEnvA(prevEnvA => {
            const lines = prevEnvA.split('\n');
            const newLines: string[] = [];
            let foundKeyInA = false;

            for (const line of lines) {
                const trimmed = line.trim();
                // Check if the line is not a comment and starts with the key followed by '='
                if (trimmed && !trimmed.startsWith('#') && trimmed.startsWith(`${key}=`)) {
                    newLines.push(`${key}=${valueB}`); // Update the value
                    foundKeyInA = true;
                } else {
                    newLines.push(line); // Keep original line
                }
            }

            if (!foundKeyInA) { // If key was not found in A, add it as a new line
                newLines.push(`${key}=${valueB}`);
            }

            return newLines.join('\n');
        });
    }, []);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 font-sans">
            <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex items-center mb-4 sm:mb-0">
                    <LockClosedIcon className="h-8 w-8 text-indigo-400" aria-hidden="true" />
                    <h1 className="text-3xl font-bold text-slate-100 ml-3">
                        Environment Diff Tool
                    </h1>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setShowSensitive(prev => !prev)}
                        className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
                        aria-label={showSensitive ? 'Hide sensitive values' : 'Show sensitive values'}
                    >
                        {showSensitive ? <EyeSlashIcon className="h-5 w-5 mr-2" aria-hidden="true" /> : <EyeIcon className="h-5 w-5 mr-2" aria-hidden="true" />}
                        {showSensitive ? 'Hide Sensitive' : 'Show Sensitive'}
                    </button>
                </div>
            </header>
            <p className="text-slate-400 mt-1 mb-6 max-w-2xl text-base">
                Compare two <code>.env</code> files to identify differences in environment variables.
                Changes are highlighted for easy identification: <span className="text-green-300">added</span>, <span className="text-red-300">removed</span>, or <span className="text-yellow-300">changed</span>.
                You can upload files, filter and sort results, search, and toggle sensitive key visibility.
            </p>

            {error && (
                <div role="alert" className="p-4 mb-4 bg-red-900 text-red-100 rounded-md border border-red-700">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                </div>
            )}
            {loading && (
                <div role="status" className="p-4 mb-4 bg-blue-900 text-blue-100 rounded-md border border-blue-700 flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-semibold">Loading...</p>
                </div>
            )}

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden mb-6">
                <div className="flex flex-col h-full bg-slate-900 p-4 rounded-lg border border-slate-700 shadow-lg">
                    <label htmlFor="env-a" className="text-sm font-medium text-slate-300 mb-2 flex justify-between items-center">
                        Environment A
                        <div className="flex space-x-2">
                            <label htmlFor="file-upload-a" className="cursor-pointer flex items-center px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-md text-xs transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900">
                                <CloudArrowUpIcon className="h-4 w-4 mr-1" aria-hidden="true" /> Upload
                            </label>
                            <input id="file-upload-a" type="file" accept=".env, .txt" className="hidden" onChange={(e) => handleFileUpload(e, 'A')} />
                            <button
                                onClick={() => handleDownloadEnv(envA, 'env-A.env')}
                                className="flex items-center px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                                aria-label="Download Environment A"
                            >
                                <CloudArrowDownIcon className="h-4 w-4 mr-1" aria-hidden="true" /> Download
                            </button>
                        </div>
                    </label>
                    <textarea
                        id="env-a"
                        value={envA}
                        onChange={e => setEnvA(e.target.value)}
                        className="flex-grow p-4 bg-slate-800 border border-slate-700 rounded-md resize-none font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="Paste your .env content here for Environment A..."
                        aria-label="Environment A content"
                    />
                </div>
                <div className="flex flex-col h-full bg-slate-900 p-4 rounded-lg border border-slate-700 shadow-lg">
                    <label htmlFor="env-b" className="text-sm font-medium text-slate-300 mb-2 flex justify-between items-center">
                        Environment B
                        <div className="flex space-x-2">
                            <label htmlFor="file-upload-b" className="cursor-pointer flex items-center px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-md text-xs transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900">
                                <CloudArrowUpIcon className="h-4 w-4 mr-1" aria-hidden="true" /> Upload
                            </label>
                            <input id="file-upload-b" type="file" accept=".env, .txt" className="hidden" onChange={(e) => handleFileUpload(e, 'B')} />
                            <button
                                onClick={() => handleDownloadEnv(envB, 'env-B.env')}
                                className="flex items-center px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                                aria-label="Download Environment B"
                            >
                                <CloudArrowDownIcon className="h-4 w-4 mr-1" aria-hidden="true" /> Download
                            </button>
                        </div>
                    </label>
                    <textarea
                        id="env-b"
                        value={envB}
                        onChange={e => setEnvB(e.target.value)}
                        className="flex-grow p-4 bg-slate-800 border border-slate-700 rounded-md resize-none font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="Paste your .env content here for Environment B..."
                        aria-label="Environment B content"
                    />
                </div>
            </div>

            <div className="mt-6 flex-grow flex flex-col bg-slate-900 p-4 rounded-lg border border-slate-700 shadow-lg">
                <h3 className="text-xl font-bold mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                    Differences
                    <div className="flex flex-wrap items-center gap-4 mt-3 sm:mt-0">
                        <input
                            type="text"
                            placeholder="Search keys or values..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="p-2 bg-slate-800 border border-slate-700 rounded-md text-sm placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-auto min-w-[150px]"
                            aria-label="Search differences"
                        />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as FilterOption)}
                            className="p-2 bg-slate-800 border border-slate-700 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-auto"
                            aria-label="Filter differences by type"
                        >
                            <option value="all">All Types</option>
                            <option value="added">Added</option>
                            <option value="removed">Removed</option>
                            <option value="changed">Changed</option>
                            <option value="same">Same</option>
                        </select>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortOption)}
                            className="p-2 bg-slate-800 border border-slate-700 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-auto"
                            aria-label="Sort differences"
                        >
                            <option value="key-asc">Key (A-Z)</option>
                            <option value="key-desc">Key (Z-A)</option>
                            <option value="type-asc">Type (Asc)</option>
                            <option value="type-desc">Type (Desc)</option>
                        </select>
                    </div>
                </h3>
                <div className="overflow-y-auto flex-grow rounded-lg border border-slate-700 bg-slate-800">
                    <div className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_max-content] md:grid-cols-[1.5fr_2fr_2fr_120px] gap-2 p-2 bg-slate-700 sticky top-0 z-10 rounded-t-lg text-slate-300 font-semibold text-sm">
                        <span className="p-2">Key</span>
                        <span className="p-2">Value (A)</span>
                        <span className="p-2">Value (B)</span>
                        <span className="p-2 text-center">Actions</span>
                    </div>
                    {filteredAndSortedDiff.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No differences found matching your criteria.
                        </div>
                    )}
                    {filteredAndSortedDiff.map(({ key, valueA, valueB, type, valueDiff, isSensitive }) => (
                        <div key={key} className={`grid grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_max-content] md:grid-cols-[1.5fr_2fr_2fr_120px] gap-2 p-2 rounded-md transition-colors duration-150 ease-in-out ${getRowClass(type)} border-b border-slate-700 last:border-b-0`}>
                            <div className="flex items-center text-slate-400 font-medium break-all">
                                {key}
                                <button
                                    onClick={() => copyToClipboard(key)}
                                    className="ml-2 p-1 text-slate-500 hover:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                    title={`Copy key "${key}"`}
                                    aria-label={`Copy key "${key}" to clipboard`}
                                >
                                    <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="font-mono text-sm text-slate-300 flex items-center break-all">
                                {type === 'added' ? <span className="text-slate-500 italic">N/A</span> : (
                                    isSensitive && !showSensitive ? <span className="text-slate-500 italic">***********</span> : (valueDiff && type === 'changed' ? renderValueDiff(valueDiff.a, isSensitive) : valueA)
                                )}
                                {type !== 'added' && valueA && (!isSensitive || showSensitive) && (
                                    <button
                                        onClick={() => copyToClipboard(valueA)}
                                        className="ml-2 p-1 text-slate-500 hover:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                        title={`Copy value from A for "${key}"`}
                                        aria-label={`Copy value "${valueA}" from Environment A to clipboard`}
                                    >
                                        <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                            <div className="font-mono text-sm text-slate-300 flex items-center break-all">
                                {type === 'removed' ? <span className="text-slate-500 italic">N/A</span> : (
                                    isSensitive && !showSensitive ? <span className="text-slate-500 italic">***********</span> : (valueDiff && type === 'changed' ? renderValueDiff(valueDiff.b, isSensitive) : valueB)
                                )}
                                 {type !== 'removed' && valueB && (!isSensitive || showSensitive) && (
                                    <button
                                        onClick={() => copyToClipboard(valueB)}
                                        className="ml-2 p-1 text-slate-500 hover:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                        title={`Copy value from B for "${key}"`}
                                        aria-label={`Copy value "${valueB}" from Environment B to clipboard`}
                                    >
                                        <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                            <div className="flex justify-center items-center space-x-2">
                                {(type === 'changed' || type === 'added') && (
                                    <button
                                        onClick={() => applyChange(key, valueB)}
                                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-md text-xs transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                        title={`Apply change: Copy value from B to A for "${key}"`}
                                        aria-label={`Apply change for key ${key}, copy value from B to A`}
                                    >
                                        Apply B to A
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Component: AppErrorBoundary
// This is an example of an enterprise-grade error boundary.
// In a typical application, this would wrap the main application routes or critical sections
// to catch JavaScript errors in their component tree, log them, and display a fallback UI.
export class AppErrorBoundary extends React.Component<React.PropsWithChildren<{}>, { hasError: boolean; error: Error | null }> {
    public state: { hasError: boolean; error: Error | null } = {
        hasError: false,
        error: null,
    };

    /**
     * @static getDerivedStateFromError
     * Lifecycle method to update state when an error is thrown.
     *
     * @param {Error} _error The error that was thrown.
     * @returns {{ hasError: boolean; error: Error | null }} New state indicating an error occurred.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static getDerivedStateFromError(_: Error): { hasError: boolean; error: Error | null } {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error: _ };
    }

    /**
     * @method componentDidCatch
     * Lifecycle method to catch errors and log them.
     *
     * @param {Error} error The error that was thrown.
     * @param {React.ErrorInfo} errorInfo Additional information about the error.
     */
    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // You can log the error to an error reporting service here (e.g., Sentry, Rollbar, etc.)
        console.error("Uncaught error in AppErrorBoundary:", error, errorInfo);
        // Example: Sentry.captureException(error, { extra: errorInfo });
    }

    /**
     * @method render
     * Renders the children components or a fallback UI if an error occurred.
     *
     * @returns {React.ReactNode} The rendered UI.
     */
    public render(): React.ReactNode {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
                    <div className="bg-red-900 text-red-100 p-6 rounded-lg shadow-xl text-center border border-red-700 max-w-lg w-full">
                        <h2 className="text-2xl font-bold mb-4">Something went wrong.</h2>
                        <p className="mb-4 text-base">We're sorry for the inconvenience. Please try refreshing the page.</p>
                        {this.state.error && (
                            <details className="text-sm text-red-200 mt-4 cursor-pointer">
                                <summary className="hover:text-red-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-900 rounded inline-block">Error Details</summary>
                                <pre className="mt-2 p-3 bg-red-800 rounded-md text-left whitespace-pre-wrap overflow-x-auto text-xs">
                                    <strong>Message:</strong> {this.state.error.message}<br/><br/>
                                    <strong>Stack:</strong><br/>
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-6 py-2 bg-red-700 hover:bg-red-600 rounded-md font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-900"
                            aria-label="Refresh page"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}