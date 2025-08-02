
import React, { useState, useEffect, useCallback } from 'react';
import { ServerIcon } from '../icons/FeatureIcons.tsx';

type EnvSet = { [key: string]: string };
type AllEnvs = { [name: string]: EnvSet };

const useLocalStorage = (key: string, initialValue: any) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.log(error);
            return initialValue;
        }
    });

    const setValue = (value: any) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.log(error);
        }
    };

    return [storedValue, setValue];
};


export const EnvManager: React.FC = () => {
    const [envs, setEnvs] = useLocalStorage('devcore_envs', { development: { API_URL: 'http://localhost:3000' }, production: { API_URL: 'https://api.myapp.com' } });
    const [activeEnv, setActiveEnv] = useState('development');
    const [newEnvName, setNewEnvName] = useState('');
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const currentVars = envs[activeEnv] || {};

    const handleAddVar = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKey) return;
        const newEnvs = {...envs};
        newEnvs[activeEnv][newKey] = newValue;
        setEnvs(newEnvs);
        setNewKey('');
        setNewValue('');
    };
    
    const handleUpdateVar = (key: string, value: string) => {
        const newEnvs = {...envs};
        newEnvs[activeEnv][key] = value;
        setEnvs(newEnvs);
    }
    
    const handleDeleteVar = (key: string) => {
         const newEnvs = {...envs};
         delete newEnvs[activeEnv][key];
         setEnvs(newEnvs);
    };
    
    const handleAddEnv = () => {
        if(!newEnvName || envs[newEnvName]) return;
        setEnvs({...envs, [newEnvName]: {}});
        setActiveEnv(newEnvName);
        setNewEnvName('');
    }

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ServerIcon />
                    <span className="ml-3">Environment Variable Manager</span>
                </h1>
                <p className="text-slate-400 mt-1">Manage and switch between different .env configurations.</p>
            </header>
            <div className="flex-grow flex gap-6 min-h-0">
                <aside className="w-1/4 bg-slate-800/50 p-4 rounded-lg flex flex-col">
                    <h3 className="font-bold mb-2">Environments</h3>
                    <ul className="space-y-2 flex-grow overflow-y-auto">
                        {Object.keys(envs).map(name => (
                            <li key={name}>
                                <button onClick={() => setActiveEnv(name)} className={`w-full text-left px-3 py-2 rounded-md ${activeEnv === name ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-700/50'}`}>
                                    {name}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-slate-700">
                         <input type="text" value={newEnvName} onChange={e => setNewEnvName(e.target.value)} placeholder="New environment name..." className="w-full px-2 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-sm mb-2" />
                         <button onClick={handleAddEnv} className="w-full text-sm py-2 bg-cyan-500/80 text-white rounded-md">Add Environment</button>
                    </div>
                </aside>
                <main className="w-3/4 bg-slate-900 p-6 rounded-lg flex flex-col">
                     <h2 className="text-2xl font-bold mb-4">Editing: <span className="text-cyan-400">{activeEnv}</span></h2>
                     <div className="flex-grow overflow-y-auto pr-2">
                        <div className="space-y-3">
                        {Object.entries(currentVars).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 font-mono text-sm">
                                <span className="text-slate-400">{key}=</span>
                                <input type="text" value={String(value)} onChange={e => handleUpdateVar(key, e.target.value)} className="flex-grow px-2 py-1 rounded bg-slate-800 border border-slate-700 text-yellow-300" />
                                 <button onClick={() => handleDeleteVar(key)} className="px-2 py-1 text-red-400 hover:bg-red-500/20 rounded-md">&times;</button>
                            </div>
                        ))}
                        </div>
                     </div>
                     <form onSubmit={handleAddVar} className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-2 font-mono text-sm">
                        <input type="text" value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="NEW_VARIABLE" className="w-1/3 px-2 py-1.5 rounded bg-slate-800 border border-slate-700" />
                        <span className="text-slate-400">=</span>
                        <input type="text" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="its_value" className="flex-grow px-2 py-1.5 rounded bg-slate-800 border border-slate-700" />
                        <button type="submit" className="px-4 py-1.5 bg-cyan-500/80 text-white rounded-md text-sans">Add</button>
                    </form>
                </main>
            </div>
        </div>
    );
};