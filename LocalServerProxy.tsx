
import React, { useState } from 'react';
import { ServerIcon } from '../icons/FeatureIcons';

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

interface Rule {
    id: number;
    source: string;
    target: string;
}

export const LocalServerProxy: React.FC = () => {
    const [rules, setRules] = useLocalStorage('devcore_proxyRules', [{ id: 1, source: '/api', target: 'http://localhost:8080' }]);
    const [source, setSource] = useState('');
    const [target, setTarget] = useState('');

    const addRule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!source || !target) return;
        setRules([...rules, { id: Date.now(), source, target }]);
        setSource('');
        setTarget('');
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ServerIcon />
                    <span className="ml-3">Local Server Proxy (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">Configure and manage local proxy rules.</p>
            </header>
            <div className="space-y-3 mb-8">
                {rules.map((rule: Rule) => (
                    <div key={rule.id} className="bg-slate-800/50 p-3 rounded-lg flex items-center font-mono text-sm">
                        <span className="text-slate-300">{rule.source}</span>
                        <span className="mx-4 text-slate-500">→</span>
                        <span className="text-cyan-400">{rule.target}</span>
                    </div>
                ))}
            </div>
             <form onSubmit={addRule} className="mt-auto pt-6 border-t border-slate-800">
                <h3 className="text-xl font-bold mb-2">Add New Rule</h3>
                <div className="flex gap-4 items-center">
                     <input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="/source-path" className="w-1/3 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                     <span className="text-slate-500 text-2xl">→</span>
                     <input type="text" value={target} onChange={e => setTarget(e.target.value)} placeholder="http://target-url" className="flex-grow px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                     <button type="submit" className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md">Add</button>
                </div>
            </form>
        </div>
    );
};
