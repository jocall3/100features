import React, { useState } from 'react';
import { TerminalIcon } from '../icons/FeatureIcons.tsx';

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

export const VimModeToggle: React.FC = () => {
    const [vimEnabled, setVimEnabled] = useLocalStorage('devcore_vimMode', false);

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <TerminalIcon />
                    <span className="ml-3">VIM Mode Toggle</span>
                </h1>
                <p className="text-slate-400 mt-1">Enable or disable VIM keybindings in the editor.</p>
            </header>
            <div className="flex items-center justify-center gap-4">
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={vimEnabled} onChange={() => setVimEnabled(!vimEnabled)} className="sr-only peer" />
                    <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
                <span className={`text-xl font-bold ${vimEnabled ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {vimEnabled ? 'VIM Mode Enabled' : 'VIM Mode Disabled'}
                </span>
            </div>
        </div>
    );
};