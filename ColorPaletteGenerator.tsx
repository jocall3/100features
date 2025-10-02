// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { generateColorPalette } from '../../services/geminiService.ts';
import { SparklesIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';

export const ColorPaletteGenerator: React.FC = () => {
    const [baseColor, setBaseColor] = useState("#06b6d4");
    const [palette, setPalette] = useState<string[]>(['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#083344']);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await generateColorPalette(baseColor);
            setPalette(result.colors);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate palette: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [baseColor]);

    const handleCopy = (color: string) => {
        navigator.clipboard.writeText(color);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center justify-center">
                    <SparklesIcon />
                    <span className="ml-3">AI Color Palette Generator</span>
                </h1>
                <p className="text-slate-400 mt-1">Pick a base color and let Gemini design a beautiful palette for you.</p>
            </header>
            <div className="flex-grow flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-4">
                     <HexColorPicker color={baseColor} onChange={setBaseColor} className="!w-64 !h-64"/>
                     <div className="p-2 bg-slate-800 rounded-md font-mono text-lg" style={{border: `1px solid ${baseColor}`}}>{baseColor}</div>
                      <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Palette'}
                    </button>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>
                <div className="flex flex-col gap-2 w-full max-w-sm">
                    <label className="text-sm font-medium text-slate-400 mb-2">Generated Palette:</label>
                    {isLoading ? (
                         <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
                    ) : (
                        palette.map((color) => (
                            <div key={color} className="group flex items-center justify-between p-4 rounded-md" style={{ backgroundColor: color }}>
                                <span className="font-mono font-bold text-black/70 mix-blend-overlay">{color}</span>
                                <button
                                    onClick={() => handleCopy(color)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/30 hover:bg-white/50 px-3 py-1 rounded text-xs text-black font-semibold">
                                    Copy
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};