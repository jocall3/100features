// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useMemo, useCallback } from 'react';
import { generateRegEx } from '../../services/geminiService.ts';
import { BeakerIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';

export const RegexSandbox: React.FC = () => {
    const [pattern, setPattern] = useState<string>('/\\b([a-z]+)ing\\b/g');
    const [testString, setTestString] = useState<string>('The quick brown fox is jumping over the lazy dog. Testing...');
    const [aiPrompt, setAiPrompt] = useState<string>('find words ending in "ing"');
    const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

    const { matches, error } = useMemo(() => {
        try {
            const patternParts = pattern.match(/^\/(.*)\/([gimyus]*)$/);
            if (!patternParts) {
                return { matches: null, error: 'Invalid regex literal format. Use /pattern/flags.' };
            }
            const [, regexBody, regexFlags] = patternParts;
            const regex = new RegExp(regexBody, regexFlags);
            const allMatches = [...testString.matchAll(regex)];
            return { matches: allMatches, error: null };
        } catch (e) {
            if (e instanceof Error) {
                return { matches: null, error: e.message };
            }
            return { matches: null, error: 'An unknown error occurred.' };
        }
    }, [pattern, testString]);
    
    const handleGenerateRegex = useCallback(async () => {
        if (!aiPrompt) return;
        setIsAiLoading(true);
        try {
            const result = await generateRegEx(aiPrompt);
            setPattern(result);
        } catch(e) {
            console.error(e);
        } finally {
            setIsAiLoading(false);
        }
    }, [aiPrompt]);

    const highlightedString = useMemo(() => {
        if (!matches || matches.length === 0) return testString;
        let lastIndex = 0;
        const parts = [];
        matches.forEach((match, i) => {
            if (match.index === undefined) return;
            parts.push(testString.substring(lastIndex, match.index));
            parts.push(<mark key={i} className="bg-cyan-500/30 text-cyan-200 rounded px-1">{match[0]}</mark>);
            lastIndex = match.index + match[0].length;
        });
        parts.push(testString.substring(lastIndex));
        return parts;
    }, [matches, testString]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <BeakerIcon />
                    <span className="ml-3">RegEx Sandbox</span>
                </h1>
                <p className="text-slate-400 mt-1">Test your regular expressions and generate them with AI.</p>
            </header>
            <div className="flex flex-col gap-4 flex-grow min-h-0">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe the pattern to find..."
                        className="flex-grow px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-sm focus:ring-2 focus:ring-cyan-500"
                    />
                    <button onClick={handleGenerateRegex} disabled={isAiLoading} className="px-4 py-1.5 bg-cyan-500 text-slate-900 font-bold rounded-md flex items-center">
                        {isAiLoading ? <LoadingSpinner/> : 'Generate'}
                    </button>
                </div>
                <div>
                    <label htmlFor="regex-pattern" className="text-sm font-medium text-slate-400">Regular Expression</label>
                    <input
                        id="regex-pattern"
                        type="text"
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                        className={`w-full mt-1 px-3 py-2 rounded-md bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-700'} font-mono text-sm focus:ring-2 focus:ring-cyan-500`}
                    />
                     {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                </div>
                <div className="flex flex-col flex-grow min-h-0">
                    <label htmlFor="test-string" className="text-sm font-medium text-slate-400">Test String</label>
                    <textarea
                        id="test-string"
                        value={testString}
                        onChange={(e) => setTestString(e.target.value)}
                        className="w-full mt-1 p-3 rounded-md bg-slate-900 border border-slate-700 font-mono text-sm resize-y h-32"
                    />
                    <div className="mt-2 p-3 bg-slate-800/50 rounded-md border border-slate-700/50">
                        {highlightedString}
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <h3 className="text-lg font-bold">Matches ({matches?.length || 0})</h3>
                     <div className="mt-2 p-2 bg-slate-900 rounded-md overflow-y-auto max-h-48">
                        {matches && matches.length > 0 ? (
                            <pre className="text-xs text-green-300">{JSON.stringify(matches, null, 2)}</pre>
                        ) : (
                            <p className="text-slate-500 text-sm">No matches found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};