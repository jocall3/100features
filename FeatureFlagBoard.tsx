// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState } from 'react';
import { CommandLineIcon } from '../icons/FeatureIcons.tsx';

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

interface FeatureFlag {
    key: string;
    description: string;
    enabled: boolean;
}

const initialFlags: FeatureFlag[] = [
    { key: 'new-dashboard', description: 'Enable the new experimental dashboard UI.', enabled: true },
    { key: 'ai-suggestions', description: 'Show AI-powered suggestions in the editor.', enabled: false },
    { key: 'beta-api-access', description: 'Allow access to beta API endpoints.', enabled: false },
];

export const FeatureFlagBoard: React.FC = () => {
    const [flags, setFlags] = useLocalStorage('devcore_featureFlags', initialFlags);

    const toggleFlag = (key: string) => {
        setFlags((currentFlags: FeatureFlag[]) =>
            currentFlags.map(flag =>
                flag.key === key ? { ...flag, enabled: !flag.enabled } : flag
            )
        );
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CommandLineIcon />
                    <span className="ml-3">Feature Flag Toggle Board</span>
                </h1>
                <p className="text-slate-400 mt-1">Enable or disable experimental features for your session.</p>
            </header>
            <div className="flex-grow bg-slate-900/50 p-4 rounded-lg overflow-y-auto">
                <div className="space-y-4">
                    {flags.map((flag: FeatureFlag) => (
                        <div key={flag.key} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-bold text-slate-200">{flag.key}</p>
                                <p className="text-sm text-slate-400">{flag.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={flag.enabled}
                                    onChange={() => toggleFlag(flag.key)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
