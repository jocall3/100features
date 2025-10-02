// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useMemo } from 'react';
import { CodeBracketSquareIcon } from '../icons/FeatureIcons.tsx';

export const CssGridEditor: React.FC = () => {
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(4);
    const [rowGap, setRowGap] = useState(1); // in rem
    const [colGap, setColGap] = useState(1); // in rem

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: `${rowGap}rem ${colGap}rem`,
        height: '100%',
        width: '100%'
    };

    const cssCode = useMemo(() => {
        return `.grid-container {
  display: grid;
  grid-template-columns: repeat(${cols}, 1fr);
  grid-template-rows: repeat(${rows}, 1fr);
  gap: ${rowGap}rem ${colGap}rem;
}`;
    }, [rows, cols, rowGap, colGap]);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(cssCode);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CodeBracketSquareIcon />
                    <span className="ml-3">CSS Grid Visual Editor</span>
                </h1>
                <p className="text-slate-400 mt-1">Configure your grid layout and copy the generated CSS.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-1 flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold">Controls</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="rows" className="block text-sm font-medium text-slate-400">Rows ({rows})</label>
                            <input id="rows" type="range" min="1" max="12" value={rows} onChange={e => setRows(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div>
                            <label htmlFor="cols" className="block text-sm font-medium text-slate-400">Columns ({cols})</label>
                            <input id="cols" type="range" min="1" max="12" value={cols} onChange={e => setCols(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                         <div>
                            <label htmlFor="rowGap" className="block text-sm font-medium text-slate-400">Row Gap ({rowGap}rem)</label>
                            <input id="rowGap" type="range" min="0" max="8" step="0.25" value={rowGap} onChange={e => setRowGap(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                         <div>
                            <label htmlFor="colGap" className="block text-sm font-medium text-slate-400">Column Gap ({colGap}rem)</label>
                            <input id="colGap" type="range" min="0" max="8" step="0.25" value={colGap} onChange={e => setColGap(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>
                     <div className="flex-grow mt-4">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Generated CSS</label>
                        <div className="relative h-full">
                            <pre className="bg-slate-900 p-4 rounded-md text-cyan-300 text-sm overflow-auto h-full">{cssCode}</pre>
                            <button onClick={handleCopy} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs">Copy</button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-slate-900 rounded-lg p-4">
                    <div style={gridStyle}>
                        {Array.from({ length: rows * cols }).map((_, i) => (
                            <div key={i} className="bg-cyan-500/20 rounded-lg border-2 border-dashed border-cyan-400/50 flex items-center justify-center text-cyan-300">
                                <span className="text-xs opacity-70">{i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};