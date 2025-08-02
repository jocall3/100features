
import React, { useState, useCallback } from 'react';
import { ServerIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';
import { JsonTreeNavigator } from './JsonTreeNavigator.tsx';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export const ApiTester: React.FC = () => {
    const [method, setMethod] = useState<HttpMethod>('GET');
    const [url, setUrl] = useState<string>('https://jsonplaceholder.typicode.com/todos/1');
    const [body, setBody] = useState<string>('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
    const [response, setResponse] = useState<any>(null);
    const [responseStatus, setResponseStatus] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleSendRequest = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setResponse(null);
        setResponseStatus(null);
        
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (method !== 'GET') {
            try {
                options.body = JSON.stringify(JSON.parse(body));
            } catch (e) {
                setError('Invalid JSON in request body.');
                setIsLoading(false);
                return;
            }
        }

        try {
            const res = await fetch(url, options);
            const data = await res.json();
            setResponse(data);
            setResponseStatus(res.status);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Request failed: ${errorMessage}. Note: Browser security may block requests to certain domains (CORS).`);
        } finally {
            setIsLoading(false);
        }
    }, [url, method, body]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ServerIcon />
                    <span className="ml-3">API Tester</span>
                </h1>
                <p className="text-slate-400 mt-1">Send HTTP requests and view responses. Uses a public test API.</p>
            </header>
            <div className="flex flex-col flex-grow min-h-0">
                <div className="flex items-center gap-2 mb-4">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as HttpMethod)}
                        className="px-4 py-2 rounded-md bg-slate-800 border border-slate-700 font-bold"
                    >
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>DELETE</option>
                        <option>PATCH</option>
                    </select>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://api.example.com/data"
                        className="flex-grow px-4 py-2 rounded-md bg-slate-900 border border-slate-700 font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <button
                        onClick={handleSendRequest}
                        disabled={isLoading}
                        className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 disabled:bg-slate-600 flex items-center gap-2"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Send'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-400 mb-2">Request Body (JSON)</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            disabled={method === 'GET'}
                            className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-slate-800/50"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-400 mb-2">Response</label>
                        <div className="flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto relative">
                             {responseStatus && <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded ${responseStatus >= 200 && responseStatus < 300 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>Status: {responseStatus}</div>}
                            {isLoading && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                            {error && <p className="text-red-400">{error}</p>}
                            {response && !isLoading && <JsonTreeNavigator data={response} />}
                            {!isLoading && !response && !error && <div className="text-slate-500 h-full flex items-center justify-center">Response will appear here.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};