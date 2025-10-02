// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import { SparklesIcon } from '../icons/FeatureIcons.tsx';

interface Theme {
    primary: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
}

const ColorInput: React.FC<{ label: string, value: string, onChange: (color: string) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="flex items-center justify-between text-sm font-medium text-slate-400">
            {label}
            <span className="font-mono">{value}</span>
        </label>
        <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full mt-1 h-8 rounded-md bg-transparent border border-slate-700 cursor-pointer"
        />
    </div>
);

export const ThemeDesigner: React.FC = () => {
    const [theme, setTheme] = useState<Theme>({
        primary: '#06b6d4',
        background: '#0f172a',
        surface: '#1e293b',
        textPrimary: '#f1f5f9',
        textSecondary: '#94a3b8',
    });

    const handleThemeChange = (key: keyof Theme, value: string) => {
        setTheme(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <SparklesIcon />
                    <span className="ml-3">Theme Designer</span>
                </h1>
                <p className="text-slate-400 mt-1">Design and preview a custom color scheme for the UI.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-1 flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold">Colors</h3>
                    <ColorInput label="Primary" value={theme.primary} onChange={v => handleThemeChange('primary', v)} />
                    <ColorInput label="Background" value={theme.background} onChange={v => handleThemeChange('background', v)} />
                    <ColorInput label="Surface" value={theme.surface} onChange={v => handleThemeChange('surface', v)} />
                    <ColorInput label="Text Primary" value={theme.textPrimary} onChange={v => handleThemeChange('textPrimary', v)} />
                    <ColorInput label="Text Secondary" value={theme.textSecondary} onChange={v => handleThemeChange('textSecondary', v)} />
                </div>
                <div className="lg:col-span-2 rounded-lg p-8 transition-colors" style={{ backgroundColor: theme.background, color: theme.textPrimary }}>
                     <h3 className="text-2xl font-bold mb-4" style={{ color: theme.textPrimary }}>Live Preview</h3>
                     <div className="p-6 rounded-lg transition-colors" style={{ backgroundColor: theme.surface }}>
                        <h4 className="text-lg font-bold">Sample Card</h4>
                        <p className="text-sm mt-1" style={{color: theme.textSecondary}}>This is a sample card to demonstrate the theme colors.</p>
                        <button className="px-4 py-2 mt-4 rounded-md font-bold transition-colors" style={{ backgroundColor: theme.primary, color: theme.background }}>
                            Primary Button
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};