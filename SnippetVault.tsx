
import React, { useState, useEffect } from 'react';
import { LockClosedIcon } from '../icons/FeatureIcons.tsx';

interface Snippet {
    id: number;
    name: string;
    code: string;
    language: string;
}

const useLocalStorage = (key: string, initialValue: any) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) { return initialValue; }
    });
    const setValue = (value: any) => {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
    };
    return [storedValue, setValue];
};

export const SnippetVault: React.FC = () => {
    const [snippets, setSnippets] = useLocalStorage('devcore_snippets', [
        { id: 1, name: 'React Hook Boilerplate', language: 'javascript', code: `import { useState } from 'react';\n\nconst useCustomHook = () => {\n  const [value, setValue] = useState(null);\n  return { value, setValue };\n};`}
    ]);
    const [activeSnippet, setActiveSnippet] = useState<Snippet | null>(snippets[0] || null);
    
    useEffect(() => {
        if(!activeSnippet && snippets.length > 0) {
            setActiveSnippet(snippets[0]);
        }
        if (activeSnippet) {
            const freshSnippet = snippets.find((s: Snippet) => s.id === activeSnippet.id);
            setActiveSnippet(freshSnippet || null);
        }
    }, [snippets, activeSnippet]);

    const handleSelectSnippet = (snippet: Snippet) => {
        setActiveSnippet(snippet);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!activeSnippet) return;
        const updatedSnippet = { ...activeSnippet, code: e.target.value };
        setActiveSnippet(updatedSnippet);
        setSnippets(snippets.map((s: Snippet) => s.id === updatedSnippet.id ? updatedSnippet : s));
    };

    const handleAddNew = () => {
        const newSnippet = { id: Date.now(), name: 'New Snippet', language: 'plaintext', code: '' };
        setSnippets([...snippets, newSnippet]);
        setActiveSnippet(newSnippet);
    };
    
    const handleDelete = (id: number) => {
        setSnippets(snippets.filter((s: Snippet) => s.id !== id));
        if(activeSnippet?.id === id) setActiveSnippet(null);
    }

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <LockClosedIcon />
                    <span className="ml-3">Portable Snippet Vault</span>
                </h1>
                <p className="text-slate-400 mt-1">Save and reuse your favorite code snippets securely in browser storage.</p>
            </header>
            <div className="flex-grow flex gap-6 min-h-0">
                <aside className="w-1/3 bg-slate-800/50 p-4 rounded-lg flex flex-col">
                    <h3 className="font-bold mb-2">My Snippets</h3>
                    <ul className="space-y-2 flex-grow overflow-y-auto">
                        {snippets.map((snippet: Snippet) => (
                            <li key={snippet.id} className="group flex items-center justify-between">
                                <button onClick={() => handleSelectSnippet(snippet)} className={`w-full text-left px-3 py-2 rounded-md ${activeSnippet?.id === snippet.id ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-700/50'}`}>
                                    {snippet.name}
                                </button>
                                 <button onClick={() => handleDelete(snippet.id)} className="ml-2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100">&times;</button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-slate-700">
                         <button onClick={handleAddNew} className="w-full text-sm py-2 bg-cyan-500/80 text-white rounded-md">Add New Snippet</button>
                    </div>
                </aside>
                <main className="w-2/3 flex flex-col">
                    {activeSnippet ? (
                        <>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-bold text-slate-200">{activeSnippet.name}</h3>
                                 <button onClick={() => navigator.clipboard.writeText(activeSnippet.code)} className="px-3 py-1 bg-slate-700 text-xs rounded-md">Copy Code</button>
                            </div>
                            <textarea
                                value={activeSnippet.code}
                                onChange={handleCodeChange}
                                className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            />
                        </>
                    ) : (
                        <div className="flex-grow flex items-center justify-center bg-slate-900 rounded-lg text-slate-500">
                            Select a snippet or create a new one.
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};