// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useMemo } from 'react';
import { BugAntIcon } from '../icons/FeatureIcons.tsx';

const sampleStackTrace = `TypeError: Cannot read properties of undefined (reading 'name')
    at UserProfile (webpack-internal:///./src/components/UserProfile.tsx:15:30)
    at renderWithHooks (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:14985:18)
    at mountIndeterminateComponent (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:17801:13)
    at beginWork (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:19049:16)`;

export const ErrorStacktraceMapper: React.FC = () => {
    const [stackTrace, setStackTrace] = useState(sampleStackTrace);

    const mappedTrace = useMemo(() => {
        return stackTrace.split('\n').map((line, index) => {
            const match = line.match(/\(webpack-internal:\/\/\/(.*):(\d+:\d+)\)/);
            if (match) {
                const [, path, location] = match;
                const prefix = line.substring(0, match.index);
                return (
                    <div key={index}>
                        {prefix}
                        <a href="#" onClick={e => e.preventDefault()} className="text-cyan-400 underline hover:text-cyan-300">
                            (./{path}:{location})
                        </a>
                    </div>
                );
            }
            return <div key={index}>{line}</div>;
        });
    }, [stackTrace]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <BugAntIcon />
                    <span className="ml-3">Error Stacktrace Mapper (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">Paste a stack trace to see file paths become clickable links.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full">
                    <label htmlFor="stack-input" className="text-sm font-medium text-slate-400 mb-2">Raw Stack Trace</label>
                    <textarea
                        id="stack-input"
                        value={stackTrace}
                        onChange={e => setStackTrace(e.target.value)}
                        className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm"
                    />
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Mapped Output</label>
                    <div className="flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-mono text-sm text-red-300">
                            {mappedTrace}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};