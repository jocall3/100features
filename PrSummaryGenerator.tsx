import React, { useState, useCallback } from 'react';
import { generatePrSummary } from '../../services/geminiService.ts';
import { GitBranchIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';
import { marked } from 'marked';

const exampleDiff = `diff --git a/src/App.tsx b/src/App.tsx
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -1,5 +1,6 @@
 import React from 'react';
 import './App.css';
+import LoginButton from './LoginButton';
 
 function App() {
   return (
     <div className="App">
       <header className="App-header">
         <p>
           Hello, world!
         </p>
+        <LoginButton />
       </header>
     </div>
   );
 }
`;

export const PrSummaryGenerator: React.FC = () => {
    const [diff, setDiff] = useState<string>(exampleDiff);
    const [summary, setSummary] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerate = useCallback(async () => {
        if (!diff.trim()) {
            setError('Please paste a diff to generate a summary.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSummary('');
        try {
            const result = await generatePrSummary(diff);
            setSummary(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate summary: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [diff]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <GitBranchIcon />
                    <span className="ml-3">AI PR Summary Generator</span>
                </h1>
                <p className="text-slate-400 mt-1">Paste a git diff and let Gemini write the summary.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full">
                    <label htmlFor="diff-input" className="text-sm font-medium text-slate-400 mb-2">Git Diff</label>
                    <textarea
                        id="diff-input"
                        value={diff}
                        onChange={(e) => setDiff(e.target.value)}
                        className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Summary'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Generated Summary</label>
                    <div className="flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto">
                        {isLoading && (
                            <div className="flex items-center justify-center h-full">
                                <LoadingSpinner />
                            </div>
                        )}
                        {error && <p className="text-red-400">{error}</p>}
                        {summary && !isLoading && (
                            <div
                                className="prose prose-sm prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: marked(summary) }}
                            />
                        )}
                        {!isLoading && !summary && !error && (
                            <div className="text-slate-500 h-full flex items-center justify-center">
                                The PR summary will appear here.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};