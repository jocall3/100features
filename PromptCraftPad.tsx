
import React, { useState, useEffect } from 'react';
import { SparklesIcon } from '../icons/FeatureIcons.tsx';

interface Prompt {
    id: number;
    name: string;
    text: string;
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

export const PromptCraftPad: React.FC = () => {
    const [prompts, setPrompts] = useLocalStorage('devcore_prompts', [
        { id: 1, name: 'React Component Generator', text: 'Generate a React component named {name} that {description}. Style it with Tailwind CSS.'}
    ]);
    const [activePrompt, setActivePrompt] = useState<Prompt | null>(prompts[0] || null);
    
    useEffect(() => {
        if(!activePrompt && prompts.length > 0) {
            setActivePrompt(prompts[0]);
        }
         if (activePrompt) {
            const freshPrompt = prompts.find((p: Prompt) => p.id === activePrompt.id);
            setActivePrompt(freshPrompt || null);
        }
    }, [prompts, activePrompt]);

    const handleSelectPrompt = (prompt: Prompt) => {
        setActivePrompt(prompt);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!activePrompt) return;
        const updatedPrompt = { ...activePrompt, text: e.target.value };
        setActivePrompt(updatedPrompt);
        setPrompts(prompts.map((p: Prompt) => p.id === updatedPrompt.id ? updatedPrompt : p));
    };

    const handleAddNew = () => {
        const newPrompt = { id: Date.now(), name: 'New Untitled Prompt', text: '' };
        setPrompts([...prompts, newPrompt]);
        setActivePrompt(newPrompt);
    };
    
    const handleDelete = (id: number) => {
        setPrompts(prompts.filter((p: Prompt) => p.id !== id));
        if(activePrompt?.id === id) setActivePrompt(null);
    }

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <SparklesIcon />
                    <span className="ml-3">Prompt Craft Pad</span>
                </h1>
                <p className="text-slate-400 mt-1">Create, save, and manage your favorite AI prompts.</p>
            </header>
            <div className="flex-grow flex gap-6 min-h-0">
                <aside className="w-1/3 bg-slate-800/50 p-4 rounded-lg flex flex-col">
                    <h3 className="font-bold mb-2">My Prompts</h3>
                    <ul className="space-y-2 flex-grow overflow-y-auto">
                        {prompts.map((prompt: Prompt) => (
                            <li key={prompt.id} className="group flex items-center justify-between">
                                <button onClick={() => handleSelectPrompt(prompt)} className={`w-full text-left px-3 py-2 rounded-md ${activePrompt?.id === prompt.id ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-700/50'}`}>
                                    {prompt.name}
                                </button>
                                 <button onClick={() => handleDelete(prompt.id)} className="ml-2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100">&times;</button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-slate-700">
                         <button onClick={handleAddNew} className="w-full text-sm py-2 bg-cyan-500/80 text-white rounded-md">Add New Prompt</button>
                    </div>
                </aside>
                <main className="w-2/3 flex flex-col">
                    {activePrompt ? (
                        <>
                            <label htmlFor="prompt-editor" className="text-sm font-medium text-slate-400 mb-2">{activePrompt.name}</label>
                            <textarea
                                id="prompt-editor"
                                value={activePrompt.text}
                                onChange={handleTextChange}
                                className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            />
                        </>
                    ) : (
                        <div className="flex-grow flex items-center justify-center bg-slate-900 rounded-lg text-slate-500">
                            Select a prompt or create a new one.
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};