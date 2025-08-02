
import React, { useState } from 'react';
import { LockClosedIcon } from '../icons/FeatureIcons';

interface Secret {
    id: number;
    key: string;
    value: string;
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

export const SecretsVault: React.FC = () => {
    const [secrets, setSecrets] = useLocalStorage('devcore_secrets', [{ id: 1, key: 'STRIPE_API_KEY', value: 'sk_test_...'}]);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [revealed, setRevealed] = useState<number | null>(null);

    const addSecret = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKey || !newValue) return;
        setSecrets([...secrets, { id: Date.now(), key: newKey, value: newValue }]);
        setNewKey('');
        setNewValue('');
    };
    
    const deleteSecret = (id: number) => {
        setSecrets(secrets.filter((s: Secret) => s.id !== id));
    };
    
    const toggleReveal = (id: number) => {
        setRevealed(prev => prev === id ? null : id);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <LockClosedIcon />
                    <span className="ml-3">Secrets Vault (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simple vault for managing secrets, stored in your browser.</p>
            </header>
            <div className="space-y-3 mb-8">
                {secrets.map((secret: Secret) => (
                    <div key={secret.id} className="bg-slate-800/50 p-3 rounded-lg flex justify-between items-center font-mono text-sm">
                        <span className="font-bold text-slate-300">{secret.key}</span>
                        <div className="flex items-center gap-4">
                            <span>{revealed === secret.id ? secret.value : '••••••••••••••••'}</span>
                            <button onClick={() => toggleReveal(secret.id)} className="text-xs text-cyan-400">
                                {revealed === secret.id ? 'Hide' : 'Show'}
                            </button>
                            <button onClick={() => deleteSecret(secret.id)} className="text-red-400 font-bold">&times;</button>
                        </div>
                    </div>
                ))}
            </div>
             <form onSubmit={addSecret} className="mt-auto pt-6 border-t border-slate-800">
                <h3 className="text-xl font-bold mb-2">Add New Secret</h3>
                <div className="flex gap-4 items-center">
                     <input type="text" value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="SECRET_KEY_NAME" className="w-1/3 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                     <input type="password" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Value" className="flex-grow px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                     <button type="submit" className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md">Add</button>
                </div>
            </form>
        </div>
    );
};
