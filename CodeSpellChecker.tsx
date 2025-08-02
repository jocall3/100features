import React, { useState, useMemo } from 'react';
import { BeakerIcon } from '../icons/FeatureIcons.tsx';

const typos = ['funtion', 'consle', 'varable', 'docment', 'componnet'];
const typoRegex = new RegExp(`\\b(${typos.join('|')})\\b`, 'gi');

const HighlightedText: React.FC<{ text: string }> = ({ text }) => {
    const parts = useMemo(() => {
        return text.split(typoRegex).map((part, i) => {
            if (typoRegex.test(part)) {
                return <span key={i} className="underline decoration-red-500 decoration-wavy">{part}</span>;
            }
            return part;
        });
    }, [text]);

    return <>{parts}</>;
};

export const CodeSpellChecker: React.FC = () => {
    const [code, setCode] = useState('funtion myFunction() {\n  consle.log("Hello World");\n  const myVarable = docment.getElementById("root");\n  // This is a React componnet\n}');

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <BeakerIcon />
                    <span className="ml-3">Code Spell Checker (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of a spell checker that finds common typos in code.</p>
            </header>
            <div className="relative flex-grow font-mono text-sm bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-auto">
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-cyan-400 resize-none z-10"
                    spellCheck="false"
                />
                <pre className="absolute inset-0 w-full h-full p-4 pointer-events-none whitespace-pre-wrap" aria-hidden="true">
                    <HighlightedText text={code} />
                </pre>
            </div>
        </div>
    );
};