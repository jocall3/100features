// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { ServerIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';
import { JsonTreeNavigator } from './JsonTreeNavigator.tsx';

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

export const GraphqlRunner: React.FC = () => {
    const [endpoint, setEndpoint] = useState('https://rickandmortyapi.com/graphql');
    const [query, setQuery] = useState(defaultQuery);
    const [variables, setVariables] = useState('');
    const [response, setResponse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleSendRequest = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setResponse(null);
        
        let parsedVariables = {};
        try {
            if (variables.trim()) {
                parsedVariables = JSON.parse(variables);
            }
        } catch (e) {
            setError('Invalid JSON in variables.');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables: parsedVariables }),
            });
            const data = await res.json();
            if (res.ok) {
                 setResponse(data);
            } else {
                setError(data.errors ? JSON.stringify(data.errors, null, 2) : 'An unknown error occurred.');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Request failed: ${errorMessage}.`);
        } finally {
            setIsLoading(false);
        }
    }, [endpoint, query, variables]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ServerIcon />
                    <span className="ml-3">GraphQL Runner</span>
                </h1>
                <p className="text-slate-400 mt-1">Send queries and mutations to a GraphQL endpoint.</p>
            </header>
            <div className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="flex-grow px-4 py-2 rounded-md bg-slate-800 border border-slate-700 font-mono text-sm"
                />
                 <button
                    onClick={handleSendRequest}
                    disabled={isLoading}
                    className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 disabled:bg-slate-600 flex items-center gap-2"
                >
                    {isLoading ? <LoadingSpinner /> : 'Execute'}
                </button>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col flex-1">
                        <label className="text-sm font-medium text-slate-400 mb-2">Query</label>
                        <textarea value={query} onChange={e => setQuery(e.target.value)} className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm" />
                    </div>
                    <div className="flex flex-col flex-1">
                         <label className="text-sm font-medium text-slate-400 mb-2">Variables (JSON)</label>
                        <textarea value={variables} onChange={e => setVariables(e.target.value)} className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm" />
                    </div>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-400 mb-2">Response</label>
                    <div className="flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto">
                        {isLoading && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>}
                        {response && !isLoading && <JsonTreeNavigator data={response} />}
                        {!isLoading && !response && !error && <div className="text-slate-500 h-full flex items-center justify-center">Response will appear here.</div>}
                    </div>
                </div>
             </div>
        </div>
    );
};