```tsx
// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

/**
 * @file CustomHookBuilder.tsx
 * @description A comprehensive tool to generate boilerplate code for various custom React hooks.
 * This component allows users to select from a variety of predefined hook templates,
 * configure dynamic parameters, and instantly view and copy the generated TypeScript code.
 * It's designed for enterprise-grade applications, emphasizing:
 * - TypeScript for strong typing
 * - Responsive design using Tailwind CSS
 * - Accessibility (ARIA attributes, semantic HTML)
 * - Performance optimization (useMemo, useCallback)
 * - Clear user feedback and input validation
 * - Modular and maintainable internal structure.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CodeBracketIcon } from '../icons/FeatureIcons.tsx';

// --- Type Definitions ---

/**
 * Props for the CustomHookBuilder component.
 * Currently, no external props are passed, but this type is kept for future scalability.
 */
export interface CustomHookBuilderProps {}

/**
 * Defines a parameter that a custom hook template can accept.
 */
export interface HookParameter {
    id: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    defaultValue: string | number | boolean;
    description?: string;
    options?: { value: string; label: string }[]; // For 'select' type
    /** A regex pattern to validate the parameter's value */
    validationPattern?: RegExp;
    /** An error message to display if validation fails */
    validationMessage?: string;
}

/**
 * Represents a predefined template for a custom React hook.
 */
export interface HookTemplate {
    id: string;
    name: string;
    description: string;
    parameters: HookParameter[];
    /**
     * Function to generate the hook code based on hook name and provided parameter values.
     * @param hookName The desired name for the hook (e.g., useMyHook).
     * @param paramValues A map of parameter IDs to their current values.
     * @returns The generated TypeScript code for the hook.
     */
    generateCode: (hookName: string, paramValues: Record<string, any>) => string;
}

// --- Helper Functions and Constants ---

/**
 * Validates a hook name to ensure it starts with 'use' and is a valid JavaScript identifier.
 * @param name The hook name to validate.
 * @returns An error message if invalid, otherwise null.
 */
export const validateHookName = (name: string): string | null => {
    if (!name.trim()) {
        return 'Hook name cannot be empty.';
    }
    if (!name.startsWith('use')) {
        return 'Hook name must start with "use" (e.g., useMyHook).';
    }
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) { // Comprehensive JS identifier validation
        return 'Hook name is not a valid JavaScript identifier.';
    }
    // Check that there's something after 'use'
    if (name === 'use') {
        return 'Hook name must contain characters after "use".';
    }
    return null;
};

// --- Hook Templates Definitions ---

const hookTemplates: HookTemplate[] = [
    {
        id: 'useCounter',
        name: 'useCounter',
        description: 'A simple counter hook with increment, decrement, and reset functionality.',
        parameters: [
            {
                id: 'initialValue',
                label: 'Initial Count Value',
                type: 'number',
                defaultValue: 0,
                description: 'The starting value for the counter. Must be a non-negative integer.',
                validationPattern: /^\d+$/,
                validationMessage: 'Initial value must be a non-negative integer.'
            }
        ],
        generateCode: (hookName, params) => {
            const initialValue = params.initialValue !== undefined ? params.initialValue : 0;
            return `import { useState, useCallback } from 'react';

/**
 * A custom hook to manage a numerical counter.
 * @param initialValue The starting value for the counter.
 * @returns An object containing the current count, and functions to increment, decrement, and reset it.
 */
export const ${hookName} = (initialValue: number = ${initialValue}) => {
    const [count, setCount] = useState<number>(initialValue);

    const increment = useCallback(() => setCount(prevCount => prevCount + 1), []);
    const decrement = useCallback(() => setCount(prevCount => Math.max(0, prevCount - 1)), []); // Prevent negative counts
    const reset = useCallback(() => setCount(initialValue), [initialValue]);

    return { count, increment, decrement, reset };
};
`;
        }
    },
    {
        id: 'useToggle',
        name: 'useToggle',
        description: 'Toggles a boolean state.',
        parameters: [
            {
                id: 'initialValue',
                label: 'Initial Toggle State',
                type: 'boolean',
                defaultValue: false,
                description: 'The starting boolean value for the toggle state.'
            }
        ],
        generateCode: (hookName, params) => {
            const initialValue = params.initialValue === true ? 'true' : 'false';
            return `import { useState, useCallback } from 'react';

/**
 * A custom hook to toggle a boolean state.
 * @param initialValue The initial boolean value.
 * @returns A tuple containing the current state and a toggle function.
 */
export const ${hookName} = (initialValue: boolean = ${initialValue}): [boolean, () => void] => {
    const [state, setState] = useState<boolean>(initialValue);

    const toggle = useCallback(() => setState(prevState => !prevState), []);

    return [state, toggle];
};
`;
        }
    },
    {
        id: 'useLocalStorage',
        name: 'useLocalStorage',
        description: 'Persists state in localStorage, handling JSON serialization.',
        parameters: [
            {
                id: 'key',
                label: 'Local Storage Key',
                type: 'text',
                defaultValue: 'myAppKey',
                description: 'The key under which to store the value in localStorage. Must be alphanumeric, dashes, or underscores.',
                validationPattern: /^[a-zA-Z0-9_-]+$/,
                validationMessage: 'Key must be alphanumeric, dashes, or underscores.'
            },
            {
                id: 'initialValue',
                label: 'Initial Value (JS literal or JSON string)',
                type: 'text',
                defaultValue: '""', // Represents an empty string
                description: 'The initial value for the hook if nothing is found in localStorage. Provide as a JavaScript literal (e.g., `0`, `false`, `null`, `[]`, `{}`), or a JSON string. For string literals, wrap in double quotes (e.g., `"hello"`).',
            }
        ],
        generateCode: (hookName, params) => {
            const key = params.key || 'myAppKey';
            const initialValueForHookCode = params.initialValue || '""'; // User is responsible for valid JS literal string

            return `import { useState, useEffect, useCallback } from 'react';

/**
 * A custom hook to persist state in localStorage, with JSON serialization.
 * It stores and retrieves values as JSON strings.
 * @template T The type of the value to be stored.
 * @param key The localStorage key.
 * @param initialValue The initial value for the hook if no value is found in localStorage.
 *                     Can be a primitive, object, array, or a function returning one.
 * @returns A tuple containing the current state and a setter function.
 */
export const ${hookName} = <T>(key: string, initialValue: T | (() => T) = ${initialValueForHookCode}): [T, (value: T | ((prev: T) => T)) => void] => {
    // Helper function to get value from localStorage
    const getStoredValue = useCallback(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item !== null) {
                return JSON.parse(item) as T;
            }
            return initialValue instanceof Function ? initialValue() : initialValue;
        } catch (error) {
            console.error(\`Error reading localStorage key "\${key}":\`, error);
            // In case of error, return initial value
            return initialValue instanceof Function ? initialValue() : initialValue;
        }
    }, [key, initialValue]);

    const [value, setValue] = useState<T>(getStoredValue);

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(\`Error writing to localStorage key "\${key}":\`, error);
        }
    }, [key, value]);

    return [value, setValue];
};
`;
        }
    },
    {
        id: 'useDebounce',
        name: 'useDebounce',
        description: 'Debounces a value, delaying updates until a pause in changes.',
        parameters: [
            {
                id: 'delay',
                label: 'Debounce Delay (ms)',
                type: 'number',
                defaultValue: 500,
                description: 'The time in milliseconds to wait before updating the debounced value. Must be a non-negative integer.',
                validationPattern: /^\d+$/,
                validationMessage: 'Delay must be a non-negative integer.'
            }
        ],
        generateCode: (hookName, params) => {
            const delay = params.delay !== undefined ? params.delay : 500;
            return `import { useState, useEffect } from 'react';

/**
 * A custom hook to debounce a value.
 * @template T The type of the value to debounce.
 * @param value The value to debounce.
 * @param delay The delay in milliseconds before the debounced value updates.
 * @returns The debounced value.
 */
export const ${hookName} = <T>(value: T, delay: number = ${delay}): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup function to clear the timeout if value or delay changes before the timeout fires.
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Re-run effect if value or delay changes

    return debouncedValue;
};
`;
        }
    },
    {
        id: 'useFetch',
        name: 'useFetch',
        description: 'Fetches data from a URL with loading and error states.',
        parameters: [
            {
                id: 'url',
                label: 'API URL',
                type: 'text',
                defaultValue: '/api/data',
                description: 'The endpoint to fetch data from. Relative or absolute URL.',
                validationPattern: /^https?:\/\/[^\s$.?#].[^\s]*$|^\/[a-zA-Z0-9/_-]+$/, // Basic URL regex
                validationMessage: 'Please enter a valid URL (e.g., /api/users or https://api.example.com/data).'
            }
        ],
        generateCode: (hookName, params) => {
            const url = params.url || '/api/data';
            return `import { useState, useEffect, useCallback } from 'react';

interface UseFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * A custom hook for fetching data from an API endpoint.
 * @template T The expected type of the fetched data.
 * @param url The URL to fetch data from.
 * @returns An object containing the fetched data, loading state, error, and a refetch function.
 */
export const ${hookName} = <T>(url: string): UseFetchResult<T> => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [refetchIndex, setRefetchIndex] = useState<number>(0); // Used to trigger refetch

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
            }
            const result: T = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [url, refetchIndex]); // Re-fetch when url changes or refetchIndex increments

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Dependency array includes fetchData which is memoized by useCallback

    const refetch = useCallback(() => {
        setRefetchIndex(prevIndex => prevIndex + 1);
    }, []);

    return { data, loading, error, refetch };
};
`;
        }
    }
];

// --- CustomHookBuilder Component ---

export const CustomHookBuilder: React.FC<CustomHookBuilderProps> = () => {
    const [hookName, setHookName] = useState<string>('useCounter');
    const [hookNameError, setHookNameError] = useState<string | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(hookTemplates[0].id);
    const [dynamicParamValues, setDynamicParamValues] = useState<Record<string, any>>({});
    const [copied, setCopied] = useState<boolean>(false);

    // Find the currently selected template object
    const selectedTemplate = useMemo(() => {
        return hookTemplates.find(template => template.id === selectedTemplateId) || hookTemplates[0];
    }, [selectedTemplateId]);

    // Initialize dynamic parameter values when the selected template changes
    useEffect(() => {
        const initialValues: Record<string, any> = {};
        selectedTemplate.parameters.forEach(param => {
            initialValues[param.id] = param.defaultValue;
        });
        setDynamicParamValues(initialValues);
    }, [selectedTemplate]);

    // Validate hook name on input change
    const handleHookNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setHookName(newName);
        setHookNameError(validateHookName(newName));
    }, []);

    // Handle dynamic parameter changes
    const handleDynamicParamChange = useCallback((paramId: string, value: any) => {
        setDynamicParamValues(prev => ({
            ...prev,
            [paramId]: value
        }));
    }, []);

    // Generate the hook code using the selected template and current parameters
    const generatedCode = useMemo(() => {
        if (hookNameError) {
            return `// Please fix the hook name: ${hookNameError}`;
        }

        // Validate dynamic parameters before generating code
        for (const param of selectedTemplate.parameters) {
            if (param.validationPattern) {
                const value = String(dynamicParamValues[param.id]);
                if (!value.match(param.validationPattern)) {
                    return `// Parameter "${param.label}" is invalid: ${param.validationMessage || 'Please check the input.'}`;
                }
            }
        }

        return selectedTemplate.generateCode(hookName, dynamicParamValues);
    }, [hookName, hookNameError, selectedTemplate, dynamicParamValues]);

    // Handle copy code to clipboard
    const handleCopyCode = useCallback(() => {
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        const timer = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(timer); // Cleanup on unmount or re-trigger
    }, [generatedCode]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CodeBracketIcon className="h-8 w-8 text-cyan-400" />
                    <span className="ml-3">Custom Hook Builder</span>
                </h1>
                <p className="text-slate-400 mt-1">Generate boilerplate for a custom React hook.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold text-slate-200">Configuration</h3>

                    {/* Hook Name Input */}
                    <div>
                        <label htmlFor="hookName" className="block text-sm font-medium text-slate-400 mb-1">Hook Name (e.g., useMyHook)</label>
                        <input
                            type="text"
                            id="hookName"
                            value={hookName}
                            onChange={handleHookNameChange}
                            className={`w-full px-3 py-2 rounded-md bg-slate-800 border ${hookNameError ? 'border-red-500' : 'border-slate-700'} font-mono text-slate-200 focus:ring-cyan-500 focus:border-cyan-500 outline-none`}
                            aria-invalid={!!hookNameError}
                            aria-describedby="hook-name-error"
                        />
                        {hookNameError && (
                            <p id="hook-name-error" className="mt-1 text-sm text-red-400" role="alert">{hookNameError}</p>
                        )}
                    </div>

                    {/* Template Selection */}
                    <div>
                        <label htmlFor="templateSelect" className="block text-sm font-medium text-slate-400 mb-1">Select Hook Template</label>
                        <select
                            id="templateSelect"
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 font-mono text-slate-200 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                            aria-label="Select a hook template"
                        >
                            {hookTemplates.map(template => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-sm text-slate-500">{selectedTemplate.description}</p>
                    </div>

                    {/* Dynamic Parameters */}
                    {selectedTemplate.parameters.length > 0 && (
                        <div className="mt-4 border-t border-slate-700 pt-4">
                            <h4 className="text-lg font-bold text-slate-200 mb-3">Template Parameters</h4>
                            {selectedTemplate.parameters.map(param => (
                                <div key={param.id} className="mb-4">
                                    <label htmlFor={`param-${param.id}`} className="block text-sm font-medium text-slate-400 mb-1">
                                        {param.label}
                                    </label>
                                    {param.type === 'boolean' ? (
                                        <input
                                            type="checkbox"
                                            id={`param-${param.id}`}
                                            checked={dynamicParamValues[param.id] === true}
                                            onChange={(e) => handleDynamicParamChange(param.id, e.target.checked)}
                                            className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-slate-700 rounded bg-slate-800"
                                            aria-describedby={`param-${param.id}-desc`}
                                        />
                                    ) : param.type === 'select' ? (
                                        <select
                                            id={`param-${param.id}`}
                                            value={dynamicParamValues[param.id] || ''}
                                            onChange={(e) => handleDynamicParamChange(param.id, e.target.value)}
                                            className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 font-mono text-slate-200 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                                            aria-describedby={`param-${param.id}-desc`}
                                        >
                                            {param.options?.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={param.type}
                                            id={`param-${param.id}`}
                                            value={dynamicParamValues[param.id] !== undefined ? dynamicParamValues[param.id] : ''}
                                            onChange={(e) => {
                                                let val: string | number = e.target.value;
                                                if (param.type === 'number') {
                                                    val = parseFloat(val);
                                                    if (isNaN(val)) val = ''; // Allow empty for number, or default to 0 if needed
                                                }
                                                handleDynamicParamChange(param.id, val);
                                            }}
                                            className={`w-full px-3 py-2 rounded-md bg-slate-800 border ${param.validationPattern && dynamicParamValues[param.id] && !String(dynamicParamValues[param.id]).match(param.validationPattern) ? 'border-red-500' : 'border-slate-700'} font-mono text-slate-200 focus:ring-cyan-500 focus:border-cyan-500 outline-none`}
                                            aria-describedby={`param-${param.id}-desc`}
                                            aria-invalid={!!(param.validationPattern && dynamicParamValues[param.id] && !String(dynamicParamValues[param.id]).match(param.validationPattern))}
                                            min={param.type === 'number' ? 0 : undefined} // Add min for numbers
                                        />
                                    )}
                                    {param.description && (
                                        <p id={`param-${param.id}-desc`} className="mt-1 text-xs text-slate-500">{param.description}</p>
                                    )}
                                    {param.validationPattern && dynamicParamValues[param.id] && !String(dynamicParamValues[param.id]).match(param.validationPattern) && (
                                        <p className="mt-1 text-sm text-red-400" role="alert">
                                            {param.validationMessage || `Invalid value for ${param.label}.`}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-400 mb-2">Generated Code</label>
                    <div className="relative flex-grow bg-slate-900 rounded-lg shadow-lg">
                        <pre className="w-full h-full p-4 rounded-md text-cyan-300 text-sm overflow-auto font-mono custom-scrollbar">
                            {generatedCode}
                        </pre>
                        <button
                            onClick={handleCopyCode}
                            className="absolute top-2 right-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs text-slate-100 transition-colors duration-200 flex items-center"
                            aria-live="polite"
                        >
                            {copied ? (
                                <>
                                    <svg className="w-4 h-4 mr-1 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden style for custom-scrollbar (Tailwind doesn't natively support full scrollbar styling) */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1e293b; /* slate-800 */
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #475569; /* slate-600 */
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #64748b; /* slate-500 */
                }
            `}</style>
        </div>
    );
};
```