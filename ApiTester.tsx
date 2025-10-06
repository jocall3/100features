// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

// This file implements an enterprise-grade API testing component.
// It allows users to send HTTP requests (GET, POST, PUT, DELETE, PATCH) to any URL,
// customize request bodies (with JSON validation and formatting), add custom headers,
// and view structured JSON responses. It includes features for accessibility,
// basic state persistence (URL and method), error handling, and visual feedback
// for loading states and response status.
//
// Features include:
// - Method (GET, POST, PUT, DELETE, PATCH) and URL input.
// - Request Body input with JSON validation and formatting.
// - Dynamic Request Headers management (add/remove key-value pairs).
// - Loading spinner for active requests.
// - Display of HTTP response status.
// - Structured JSON response viewer (JsonTreeNavigator).
// - Copy response to clipboard functionality.
// - Persistence of last used URL and Method in local storage.
// - Comprehensive error handling for network issues and invalid JSON.
// - Accessibility attributes (ARIA labels, semantic HTML).
// - Responsive design using Tailwind CSS.

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ServerIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';
import { JsonTreeNavigator } from './JsonTreeNavigator.tsx';
import { ClipboardCopyIcon, PlusCircleIcon, MinusCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'; // Importing some icons for new features

/**
 * @typedef {('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')} HttpMethod
 * Represents the allowed HTTP methods for the API tester.
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * @typedef {object} RequestHeader
 * Represents a single request header with a unique ID, key, and value.
 */
interface RequestHeader {
    id: string;
    key: string;
    value: string;
}

/**
 * `formatJsonString`
 * Utility function to format a JSON string with an indentation of 2 spaces.
 * It handles invalid JSON gracefully by returning the original string and logging an error.
 * @param {string} jsonString The JSON string to format.
 * @returns {string} The formatted JSON string or the original string if invalid.
 */
export const formatJsonString = (jsonString: string): string => {
    try {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed, null, 2);
    } catch (e) {
        console.error("Failed to format JSON:", e);
        return jsonString; // Return original if invalid
    }
};

/**
 * `ApiTester`
 * A comprehensive React functional component for testing RESTful APIs.
 * It provides UI elements to construct and send HTTP requests and view the responses.
 * This component demonstrates best practices for state management, error handling,
 * accessibility, and user experience in a React application.
 */
export const ApiTester: React.FC = () => {
    // State for HTTP method, initialized from localStorage or default 'GET'.
    const [method, setMethod] = useState<HttpMethod>(() => {
        return (localStorage.getItem('apiTesterMethod') as HttpMethod) || 'GET';
    });
    // State for URL, initialized from localStorage or a public test API endpoint.
    const [url, setUrl] = useState<string>(() => {
        return localStorage.getItem('apiTesterUrl') || 'https://jsonplaceholder.typicode.com/todos/1';
    });
    // State for request body, pre-filled with a sample JSON for POST/PUT/PATCH.
    const [body, setBody] = useState<string>('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
    // State for custom request headers.
    const [headers, setHeaders] = useState<RequestHeader[]>([]);
    // State for the API response data.
    const [response, setResponse] = useState<any>(null);
    // State for the HTTP response status code.
    const [responseStatus, setResponseStatus] = useState<number | null>(null);
    // State to indicate if a request is currently in progress.
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // State for any error messages during the request process.
    const [error, setError] = useState<string>('');
    // State to track if the request body JSON is valid.
    const [isBodyJsonValid, setIsBodyJsonValid] = useState<boolean>(true);

    /**
     * `useEffect` hook to persist `url` and `method` to `localStorage` whenever they change.
     */
    useEffect(() => {
        localStorage.setItem('apiTesterUrl', url);
    }, [url]);

    useEffect(() => {
        localStorage.setItem('apiTesterMethod', method);
    }, [method]);

    /**
     * `handleBodyChange`
     * Handles changes to the request body textarea.
     * It updates the `body` state and performs a basic JSON validation to update `isBodyJsonValid`.
     * @param {React.ChangeEvent<HTMLTextAreaElement>} e The change event from the textarea.
     */
    const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
        const newBody = e.target.value;
        setBody(newBody);
        try {
            if (newBody.trim() === '') {
                setIsBodyJsonValid(true); // Empty body is technically valid (no JSON)
            } else {
                JSON.parse(newBody);
                setIsBodyJsonValid(true);
            }
        } catch (error) {
            setIsBodyJsonValid(false);
        }
    };

    /**
     * `handleFormatBody`
     * Formats the JSON request body using `formatJsonString` utility.
     */
    const handleFormatBody = useCallback((): void => {
        setBody(formatJsonString(body));
    }, [body]);

    /**
     * `handleAddHeader`
     * Adds a new empty header row to the headers state.
     */
    const handleAddHeader = useCallback((): void => {
        setHeaders((prevHeaders) => [...prevHeaders, { id: Date.now().toString(), key: '', value: '' }]);
    }, []);

    /**
     * `handleRemoveHeader`
     * Removes a header row identified by its ID.
     * @param {string} id The unique ID of the header to remove.
     */
    const handleRemoveHeader = useCallback((id: string): void => {
        setHeaders((prevHeaders) => prevHeaders.filter((header) => header.id !== id));
    }, []);

    /**
     * `handleHeaderChange`
     * Updates the key or value of an existing header.
     * @param {string} id The unique ID of the header to update.
     * @param {'key' | 'value'} field The field to update ('key' or 'value').
     * @param {string} newValue The new value for the specified field.
     */
    const handleHeaderChange = useCallback((id: string, field: 'key' | 'value', newValue: string): void => {
        setHeaders((prevHeaders) =>
            prevHeaders.map((header) => (header.id === id ? { ...header, [field]: newValue } : header))
        );
    }, []);

    /**
     * `handleCopyResponse`
     * Copies the formatted JSON response to the clipboard.
     * @returns {Promise<void>} A promise that resolves when the text is copied.
     */
    const handleCopyResponse = useCallback(async (): Promise<void> => {
        if (!response) {
            setError('No response to copy.');
            return;
        }
        try {
            const formattedResponse = formatJsonString(JSON.stringify(response));
            await navigator.clipboard.writeText(formattedResponse);
            // Optionally, provide user feedback that it was copied
            alert('Response copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy response:', err);
            setError('Failed to copy response to clipboard.');
        }
    }, [response]);

    /**
     * `handleSendRequest`
     * Main function to send the HTTP request.
     * It constructs the request options, handles JSON body serialization,
     * includes custom headers, and manages loading/error states.
     */
    const handleSendRequest = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setResponse(null);
        setResponseStatus(null);

        const requestHeaders: HeadersInit = {
            'Content-Type': 'application/json', // Default content type
        };

        // Add custom headers, filtering out empty ones
        headers.forEach(h => {
            if (h.key && h.value) {
                requestHeaders[h.key] = h.value;
            }
        });

        const options: RequestInit = {
            method,
            headers: requestHeaders,
        };

        if (method !== 'GET' && method !== 'HEAD') { // GET/HEAD typically don't have bodies
            if (body.trim() === '') {
                // Allow empty body for POST/PUT/PATCH if desired, but remove Content-Type if so
                delete (options.headers as Record<string, string>)['Content-Type'];
            } else {
                try {
                    options.body = JSON.stringify(JSON.parse(body));
                } catch (e) {
                    setError('Invalid JSON in request body. Please correct it before sending.');
                    setIsLoading(false);
                    return;
                }
            }
        } else {
            // Ensure no body is sent for GET/HEAD requests
            delete options.body;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId); // Clear timeout if request completes in time

            setResponseStatus(res.status);

            const contentType = res.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                const data = await res.json();
                setResponse(data);
            } else {
                const textData = await res.text();
                // Try to parse as JSON anyway, if it fails, display as plain text
                try {
                    setResponse(JSON.parse(textData));
                } catch {
                    setResponse({ message: `Non-JSON response (Content-Type: ${contentType || 'N/A'})`, data: textData });
                }
            }
        } catch (err: any) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                setError('Request timed out after 10 seconds. Check network or API availability.');
            } else {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(`Request failed: ${errorMessage}. Note: Browser security may block requests to certain domains (CORS).`);
            }
        } finally {
            setIsLoading(false);
        }
    }, [url, method, body, headers]);

    // Memoize the JSON tree navigator to prevent unnecessary re-renders if its data doesn't change deeply.
    const MemoizedJsonTreeNavigator = useMemo(() => {
        if (response && !isLoading && !error) {
            return <JsonTreeNavigator data={response} />;
        }
        return null;
    }, [response, isLoading, error]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100">
            {/* Header Section */}
            <header className="mb-6 border-b border-slate-700 pb-4">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center" aria-label="API Tester application">
                    <ServerIcon className="h-8 w-8 text-cyan-500" />
                    <span className="ml-3">API Tester</span>
                </h1>
                <p className="text-slate-400 mt-1">Send HTTP requests, customize headers, and view responses.</p>
            </header>

            <div className="flex flex-col flex-grow min-h-0">
                {/* Request URL and Method Section */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                    <label htmlFor="http-method-select" className="sr-only">HTTP Method</label>
                    <select
                        id="http-method-select"
                        value={method}
                        onChange={(e) => setMethod(e.target.value as HttpMethod)}
                        className="px-4 py-2 rounded-md bg-slate-800 border border-slate-700 font-bold text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full sm:w-auto"
                        aria-label="Select HTTP method"
                    >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                    </select>
                    <label htmlFor="url-input" className="sr-only">Request URL</label>
                    <input
                        id="url-input"
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://api.example.com/data"
                        className="flex-grow px-4 py-2 rounded-md bg-slate-900 border border-slate-700 font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-200"
                        aria-label="Request URL"
                    />
                    <button
                        onClick={handleSendRequest}
                        disabled={isLoading}
                        className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-500 disabled:bg-slate-600 disabled:text-slate-400 transition-colors duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
                        aria-label={isLoading ? "Sending request" : "Send request"}
                    >
                        {isLoading ? <LoadingSpinner size="sm" /> : 'Send'}
                    </button>
                </div>

                {/* Request Body & Headers and Response Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
                    {/* Request Section */}
                    <div className="flex flex-col">
                        {/* Request Body */}
                        <div className="flex flex-col mb-4 flex-grow max-h-[50%] lg:max-h-none">
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="request-body-textarea" className="text-sm font-medium text-slate-400">Request Body (JSON)</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleFormatBody}
                                        className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors duration-200 flex items-center gap-1"
                                        aria-label="Format JSON body"
                                        title="Format JSON body"
                                    >
                                        <DocumentTextIcon className="h-4 w-4" />
                                        Format
                                    </button>
                                </div>
                            </div>
                            <textarea
                                id="request-body-textarea"
                                value={body}
                                onChange={handleBodyChange}
                                disabled={method === 'GET' || method === 'HEAD'} // Disable body for GET/HEAD
                                className={`flex-grow p-4 bg-slate-900 border ${isBodyJsonValid ? 'border-slate-700' : 'border-red-500 ring-1 ring-red-500'} rounded-md resize-none font-mono text-sm text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-slate-800/50 min-h-[150px]`}
                                placeholder={method === 'GET' || method === 'HEAD' ? 'Body not allowed for GET/HEAD requests.' : 'Enter JSON request body here...'}
                                aria-invalid={!isBodyJsonValid}
                                aria-describedby={!isBodyJsonValid ? "json-body-error" : undefined}
                            />
                            {!isBodyJsonValid && (
                                <p id="json-body-error" className="text-red-400 text-xs mt-1">Invalid JSON format.</p>
                            )}
                        </div>

                        {/* Request Headers */}
                        <div className="flex flex-col mt-4 flex-grow max-h-[50%] lg:max-h-none">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-slate-400">Request Headers</h3>
                                <button
                                    onClick={handleAddHeader}
                                    className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors duration-200 flex items-center gap-1"
                                    aria-label="Add new header"
                                    title="Add Header"
                                >
                                    <PlusCircleIcon className="h-4 w-4" />
                                    Add Header
                                </button>
                            </div>
                            <div className="flex flex-col gap-2 overflow-y-auto p-2 bg-slate-900 border border-slate-700 rounded-md flex-grow custom-scrollbar min-h-[100px]">
                                {headers.length === 0 && (
                                    <p className="text-slate-500 text-sm text-center py-4">No custom headers. Click 'Add Header' to include them.</p>
                                )}
                                {headers.map((header) => (
                                    <div key={header.id} className="flex items-center gap-2">
                                        <label htmlFor={`header-key-${header.id}`} className="sr-only">Header Key</label>
                                        <input
                                            id={`header-key-${header.id}`}
                                            type="text"
                                            value={header.key}
                                            onChange={(e) => handleHeaderChange(header.id, 'key', e.target.value)}
                                            placeholder="Header-Key"
                                            className="w-1/2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                                            aria-label={`Header key for ${header.id}`}
                                        />
                                        <label htmlFor={`header-value-${header.id}`} className="sr-only">Header Value</label>
                                        <input
                                            id={`header-value-${header.id}`}
                                            type="text"
                                            value={header.value}
                                            onChange={(e) => handleHeaderChange(header.id, 'value', e.target.value)}
                                            placeholder="Header-Value"
                                            className="w-1/2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                                            aria-label={`Header value for ${header.key || header.id}`}
                                        />
                                        <button
                                            onClick={() => handleRemoveHeader(header.id)}
                                            className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-slate-700 transition-colors duration-200"
                                            aria-label={`Remove header ${header.key || 'untitled'}`}
                                            title="Remove Header"
                                        >
                                            <MinusCircleIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Response Section */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-400">Response</label>
                            {response && (
                                <button
                                    onClick={handleCopyResponse}
                                    className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors duration-200 flex items-center gap-1"
                                    aria-label="Copy response to clipboard"
                                    title="Copy Response"
                                >
                                    <ClipboardCopyIcon className="h-4 w-4" />
                                    Copy
                                </button>
                            )}
                        </div>
                        <div className="flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto relative custom-scrollbar">
                            {responseStatus && (
                                <div
                                    className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded ${responseStatus >= 200 && responseStatus < 300 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
                                    aria-live="polite"
                                >
                                    Status: {responseStatus}
                                </div>
                            )}
                            {isLoading && (
                                <div className="flex items-center justify-center h-full">
                                    <LoadingSpinner />
                                    <span className="ml-2 text-slate-400">Sending Request...</span>
                                </div>
                            )}
                            {error && (
                                <p className="text-red-400 p-2 bg-red-900/20 rounded" role="alert">
                                    <strong>Error:</strong> {error}
                                </p>
                            )}
                            {MemoizedJsonTreeNavigator}
                            {!isLoading && !response && !error && (
                                <div className="text-slate-500 h-full flex items-center justify-center">
                                    Response will appear here after you send a request.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};