// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { transferCodeStyle } from '../../services/geminiService.ts';
import { SparklesIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';
import { marked } from 'marked';

const exampleCode = `function my_func(x,y){return x+y;}`;
const exampleStyleGuide = `- Use camelCase for function names.
- Add a space after commas in argument lists.
- Use semicolons at the end of statements.`;

export const AiStyleTransfer: React.FC = () => {
    const [inputCode, setInputCode] = useState<string>(exampleCode);
    const [styleGuide, setStyleGuide] = useState<string>(exampleStyleGuide);
    const [outputCode, setOutputCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerate = useCallback(async () => {
        if (!inputCode.trim() || !styleGuide.trim()) {
            setError('Please provide both code and a style guide.');
            return;
        }
        setIsLoading(true);
        setError('');
        setOutputCode('');
        try {
            const result = await transferCodeStyle(inputCode, styleGuide);
            setOutputCode(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to transfer style: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [inputCode, styleGuide]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <SparklesIcon />
                    <span className="ml-3">AI Code Style Transfer</span>
                </h1>
                <p className="text-slate-400 mt-1">Rewrite code to match a specific style guide using AI.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full gap-4">
                    <div className="flex flex-col flex-1">
                        <label htmlFor="input-code" className="text-sm font-medium text-slate-400 mb-2">Original Code</label>
                        <textarea
                            id="input-code"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm"
                        />
                    </div>
                    <div className="flex flex-col flex-1">
                        <label htmlFor="style-guide" className="text-sm font-medium text-slate-400 mb-2">Style Guide</label>
                        <textarea
                            id="style-guide"
                            value={styleGuide}
                            onChange={(e) => setStyleGuide(e.target.value)}
                            className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm"
                        />
                    </div>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Rewritten Code</label>
                    <div className="flex-grow p-1 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto">
                        {isLoading && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-400">{error}</p>}
                        {outputCode && !isLoading && (
                            <div
                                className="prose prose-sm prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-4 prose-pre:m-0"
                                dangerouslySetInnerHTML={{ __html: marked(outputCode) }}
                            />
                        )}
                         {!isLoading && !outputCode && !error && <div className="text-slate-500 h-full flex items-center justify-center">Rewritten code will appear here.</div>}
                    </div>
                </div>
            </div>
            <div className="flex-shrink-0 pt-4">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full max-w-md mx-auto flex items-center justify-center px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 disabled:bg-slate-600"
                >
                    {isLoading ? <LoadingSpinner /> : 'Rewrite Code'}
                </button>
            </div>
        </div>
    );
};