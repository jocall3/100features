// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useCallback } from 'react';
import { formatCode } from '../../services/geminiService.ts';
import { CodeBracketSquareIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';
import { marked } from 'marked';

const exampleCode = `const MyComponent = (props) => {
  const {name, items}=props
    if(!items || items.length === 0){
  return <p>No items found for {name}</p>;
    }
  return <ul>{items.map(item=> <li key={item.id}>{item.name}</li>)}</ul>
}`;

export const CodeFormatter: React.FC = () => {
    const [inputCode, setInputCode] = useState<string>(exampleCode);
    const [formattedCode, setFormattedCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleFormat = useCallback(async () => {
        if (!inputCode.trim()) {
            setError('Please enter some code to format.');
            return;
        }
        setIsLoading(true);
        setError('');
        setFormattedCode('');
        try {
            const result = await formatCode(inputCode);
            setFormattedCode(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to format code: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [inputCode]);
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CodeBracketSquareIcon />
                    <span className="ml-3">AI Code Formatter</span>
                </h1>
                <p className="text-slate-400 mt-1">Clean up your code with AI-powered formatting, like a smart Prettier.</p>
            </header>
            <div className="flex-grow flex flex-col min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
                    <div className="flex flex-col h-full">
                        <label htmlFor="code-input" className="text-sm font-medium text-slate-400 mb-2">Input</label>
                        <textarea
                            id="code-input"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            placeholder="Paste your unformatted code here..."
                            className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-col h-full">
                        <label className="text-sm font-medium text-slate-400 mb-2">Output</label>
                        <div className="flex-grow p-1 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto">
                           {isLoading && (
                                <div className="flex items-center justify-center h-full">
                                    <LoadingSpinner />
                                </div>
                            )}
                            {error && <p className="p-4 text-red-400">{error}</p>}
                            {formattedCode && !isLoading && (
                                <div
                                    className="prose prose-sm prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-4 prose-pre:m-0 prose-code:text-cyan-300"
                                    dangerouslySetInnerHTML={{ __html: marked(formattedCode) }}
                                />
                            )}
                            {!isLoading && !formattedCode && !error && (
                                <div className="text-slate-500 h-full flex items-center justify-center">
                                    Formatted code will appear here.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                 <button
                    onClick={handleFormat}
                    disabled={isLoading}
                    className="mt-4 w-full max-w-sm mx-auto flex items-center justify-center px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? <LoadingSpinner /> : 'Format Code'}
                </button>
            </div>
        </div>
    );
};