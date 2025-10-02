// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect } from 'react';
import { EyeIcon } from '../icons/FeatureIcons.tsx';

const popularFonts = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro', 'Raleway', 'Poppins', 'Nunito', 'Merriweather'
];

export const FontPreviewPicker: React.FC = () => {
    const [selectedFont, setSelectedFont] = useState('Roboto');
    const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog.');

    useEffect(() => {
        if (selectedFont) {
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css?family=${selectedFont.replace(/ /g, '+')}&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            return () => {
                document.head.removeChild(link);
            };
        }
    }, [selectedFont]);
    
    const importRule = `@import url('https://fonts.googleapis.com/css?family=${selectedFont.replace(/ /g, '+')}&display=swap');`;

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <EyeIcon />
                    <span className="ml-3">Font Preview & Picker</span>
                </h1>
                <p className="text-slate-400 mt-1">Preview Google Fonts and get the CSS import rule.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-1 flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold">Controls</h3>
                    <div>
                        <label htmlFor="font-select" className="block text-sm font-medium text-slate-400">Select Font</label>
                        <select id="font-select" value={selectedFont} onChange={e => setSelectedFont(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700">
                            {popularFonts.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="preview-text" className="block text-sm font-medium text-slate-400">Preview Text</label>
                        <textarea id="preview-text" value={previewText} onChange={e => setPreviewText(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-800 border border-slate-700 h-24 resize-none"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400">CSS Import Rule</label>
                        <div className="relative mt-1">
                            <pre className="bg-slate-900 p-2 rounded-md text-cyan-300 text-xs overflow-x-auto">{importRule}</pre>
                            <button onClick={() => navigator.clipboard.writeText(importRule)} className="absolute top-1 right-1 px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded-md text-xs">Copy</button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-slate-900 rounded-lg p-8 flex items-center justify-center">
                    <p className="text-4xl" style={{ fontFamily: selectedFont }}>
                        {previewText}
                    </p>
                </div>
            </div>
        </div>
    );
};