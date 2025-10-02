// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import { FileCodeIcon } from '../icons/FeatureIcons.tsx';

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

interface Session {
    name: string;
    tabs: string[];
}

export const TabSessionsManager: React.FC = () => {
    const [sessions, setSessions] = useLocalStorage('devcore_sessions', []);
    const [currentTabs, setCurrentTabs] = useState(['App.tsx', 'geminiService.ts', 'manifest.ts']);
    const [sessionName, setSessionName] = useState('');

    const saveSession = () => {
        if (!sessionName) return;
        setSessions([...sessions, { name: sessionName, tabs: currentTabs }]);
        setSessionName('');
    };

    const loadSession = (tabs: string[]) => {
        setCurrentTabs(tabs);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <FileCodeIcon />
                    <span className="ml-3">Tab Sessions Manager</span>
                </h1>
                <p className="text-slate-400 mt-1">Save and load your open tabs to quickly switch contexts.</p>
            </header>
             <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold">Saved Sessions</h3>
                    <div className="space-y-2">
                        {sessions.map((session: Session) => (
                            <button
                                key={session.name}
                                onClick={() => loadSession(session.tabs)}
                                className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-md text-left"
                            >
                                <p className="font-bold">{session.name}</p>
                                <p className="text-xs text-slate-400 truncate">{session.tabs.join(', ')}</p>
                            </button>
                        ))}
                         {sessions.length === 0 && <p className="text-slate-500 text-sm">No saved sessions.</p>}
                    </div>
                </div>
                <div className="flex flex-col">
                     <h3 className="text-xl font-bold mb-2">Current Session</h3>
                     <div className="flex-grow bg-slate-900 p-4 rounded-lg flex flex-col">
                        <div className="flex-grow space-y-2">
                            {currentTabs.map(tab => (
                                <div key={tab} className="bg-slate-800 p-2 rounded-md">{tab}</div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                             <input type="text" value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="New session name..." className="flex-grow px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-sm"/>
                            <button onClick={saveSession} className="px-4 py-1.5 bg-cyan-500 text-slate-900 font-bold rounded-md">Save</button>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};