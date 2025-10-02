// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useCallback } from 'react';
import { generateUnitTests } from '../../services/geminiService.ts';
import { BeakerIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';
import { marked } from 'marked';

const exampleCode = `export function calculateTotalPrice(items, taxRate) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return subtotal * (1 + taxRate);
}`;

export const AiUnitTestGenerator: React.FC = () => {
    const [code, setCode] = useState<string>(exampleCode);
    const [tests, setTests] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerate = useCallback(async () => {
        if (!code.trim()) {
            setError('Please enter some code to generate tests for.');
            return;
        }
        setIsLoading(true);
        setError('');
        setTests('');
        try {
            const result = await generateUnitTests(code);
            setTests(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate tests: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [code]);

    const cleanMarkdown = (md: string) => md.replace(/^```(?:\w+\n)?/, '').replace(/```$/, '');

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <BeakerIcon />
                    <span className="ml-3">AI Unit Test Generator</span>
                </h1>
                <p className="text-slate-400 mt-1">Provide a function or component and let AI write the tests.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full">
                    <label htmlFor="code-input" className="text-sm font-medium text-slate-400 mb-2">Source Code</label>
                    <textarea
                        id="code-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Paste your source code here..."
                        className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Unit Tests'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Generated Tests</label>
                    <div className="flex-grow p-1 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto">
                        {isLoading && (
                            <div className="flex items-center justify-center h-full">
                                <LoadingSpinner />
                            </div>
                        )}
                        {error && <p className="p-4 text-red-400">{error}</p>}
                        {tests && !isLoading && (
                            <div
                                className="prose prose-sm prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-4 prose-pre:m-0 prose-code:text-cyan-300"
                                dangerouslySetInnerHTML={{ __html: marked(tests) }}
                            />
                        )}
                        {!isLoading && !tests && !error && (
                            <div className="text-slate-500 h-full flex items-center justify-center">
                                The generated tests will appear here.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};