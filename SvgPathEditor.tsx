// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import { CodeBracketSquareIcon } from '../icons/FeatureIcons.tsx';

const initialPath = "M10 80 Q 52.5 10, 95 80 T 180 80";

export const SvgPathEditor: React.FC = () => {
    const [pathData, setPathData] = useState(initialPath);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CodeBracketSquareIcon />
                    <span className="ml-3">SVG Path Editor</span>
                </h1>
                <p className="text-slate-400 mt-1">Visually create and manipulate SVG path data.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full">
                    <label htmlFor="path-input" className="text-sm font-medium text-slate-400 mb-2">Path Data (d attribute)</label>
                    <textarea
                        id="path-input"
                        value={pathData}
                        onChange={(e) => setPathData(e.target.value)}
                        className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-cyan-300"
                    />
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Live Preview</label>
                    <div className="flex-grow p-4 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-md overflow-y-auto flex items-center justify-center">
                        <svg viewBox="0 0 200 100" className="w-full h-full">
                            <path d={pathData} stroke="#06b6d4" fill="transparent" strokeWidth="2" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};