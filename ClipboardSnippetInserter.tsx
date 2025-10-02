// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect } from 'react';
import { CodeBracketIcon } from '../icons/FeatureIcons.tsx';

interface Snippet {
    id: number;
    name: string;
    code: string;
}

const useLocalStorage = (key: string, initialValue: any) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) { return initialValue; }
    });
    // This hook is for reading only in this component, so we don't return setValue
    return [storedValue];
};

export const ClipboardSnippetInserter: React.FC = () => {
    const [snippets] = useLocalStorage('devcore_snippets', []);
    const [feedback, setFeedback] = useState('');

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setFeedback('Copied!');
        setTimeout(() => setFeedback(''), 2000);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CodeBracketIcon />
                    <span className="ml-3">Clipboard Snippet Inserter</span>
                </h1>
                {feedback && <span className="text-green-400 bg-green-500/10 px-3 py-1 rounded-md">{feedback}</span>}
            </header>
            <p className="text-slate-400 -mt-4 mb-6">Quickly copy your saved snippets from the Snippet Vault.</p>
            
            <div className="flex-grow overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {snippets && snippets.length > 0 ? (
                        snippets.map((snippet: Snippet) => (
                            <div key={snippet.id} className="bg-slate-800/50 p-4 rounded-lg flex flex-col justify-between">
                                <p className="font-bold text-slate-200 truncate">{snippet.name}</p>
                                <pre className="text-xs text-slate-400 bg-slate-900 p-2 rounded-md my-2 overflow-x-auto h-24">{snippet.code}</pre>
                                <button
                                    onClick={() => handleCopy(snippet.code)}
                                    className="w-full mt-2 text-sm py-2 bg-cyan-500/80 hover:bg-cyan-500 text-white rounded-md"
                                >
                                    Copy
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-slate-500 h-full flex items-center justify-center">
                            No snippets found. Add some in the "Snippet Vault" feature.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};