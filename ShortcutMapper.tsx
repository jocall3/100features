// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import { CommandLineIcon } from '../icons/FeatureIcons.tsx';

const initialShortcuts = [
    { command: 'Open Command Palette', keys: 'Ctrl+K' },
    { command: 'Save Current File', keys: 'Ctrl+S' },
    { command: 'Toggle Sidebar', keys: 'Ctrl+B' },
    { command: 'Find in File', keys: 'Ctrl+F' },
];

export const ShortcutMapper: React.FC = () => {
    const [shortcuts, setShortcuts] = useState(initialShortcuts);
    const [editing, setEditing] = useState<string | null>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, command: string) => {
        e.preventDefault();
        const keyMap: string[] = [];
        if (e.ctrlKey) keyMap.push('Ctrl');
        if (e.altKey) keyMap.push('Alt');
        if (e.shiftKey) keyMap.push('Shift');
        if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
            keyMap.push(e.key.toUpperCase());
        }
        
        const newKeys = keyMap.join('+');
        setShortcuts(shortcuts.map(s => s.command === command ? { ...s, keys: newKeys } : s));
        setEditing(null);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CommandLineIcon />
                    <span className="ml-3">Shortcut Mapper (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation for remapping keyboard shortcuts.</p>
            </header>
            <div className="flex-grow bg-slate-900/50 p-4 rounded-lg overflow-y-auto">
                <div className="space-y-2">
                {shortcuts.map(shortcut => (
                    <div key={shortcut.command} className="bg-slate-800 p-3 rounded-md flex justify-between items-center text-sm">
                        <span className="text-slate-300">{shortcut.command}</span>
                        {editing === shortcut.command ? (
                            <input
                                type="text"
                                value="Recording..."
                                onKeyDown={(e) => handleKeyDown(e, shortcut.command)}
                                autoFocus
                                onBlur={() => setEditing(null)}
                                className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-md border border-cyan-500 text-center"
                            />
                        ) : (
                            <button
                                onClick={() => setEditing(shortcut.command)}
                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md font-mono"
                            >
                                {shortcut.keys}
                            </button>
                        )}
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
};