
import React, { useState, useCallback } from 'react';
import { generateCommitMessage } from '../../services/geminiService.ts';
import { GitBranchIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';

const exampleDiff = `diff --git a/src/components/Button.tsx b/src/components/Button.tsx
index 1b2c3d4..5e6f7g8 100644
--- a/src/components/Button.tsx
+++ b/src/components/Button.tsx
@@ -1,7 +1,7 @@
 import React from 'react';

 interface ButtonProps {
-  text: string;
+  label: string;
   onClick: () => void;
 }
`;

export const AiCommitGenerator: React.FC = () => {
    const [diff, setDiff] = useState<string>(exampleDiff);
    const [message, setMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerate = useCallback(async () => {
        if (!diff.trim()) {
            setError('Please paste a diff to generate a message.');
            return;
        }
        setIsLoading(true);
        setError('');
        setMessage('');
        try {
            const result = await generateCommitMessage(diff);
            setMessage(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate message: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [diff]);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(message);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <GitBranchIcon />
                    <span className="ml-3">AI Commit Message Generator</span>
                </h1>
                <p className="text-slate-400 mt-1">Paste your diff and let Gemini craft the perfect commit message.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full">
                    <label htmlFor="diff-input" className="text-sm font-medium text-slate-400 mb-2">Git Diff</label>
                    <textarea
                        id="diff-input"
                        value={diff}
                        onChange={(e) => setDiff(e.target.value)}
                        placeholder="Paste your git diff here..."
                        className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Commit Message'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Generated Message</label>
                    <div className="relative flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto">
                        {isLoading && (
                             <div className="flex items-center justify-center h-full">
                                <LoadingSpinner />
                             </div>
                        )}
                        {error && <p className="text-red-400">{error}</p>}
                        {message && !isLoading && (
                            <>
                               <button onClick={handleCopy} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs">Copy</button>
                               <pre className="whitespace-pre-wrap font-sans text-slate-200">{message}</pre>
                            </>
                        )}
                         {!isLoading && !message && !error && (
                            <div className="text-slate-500 h-full flex items-center justify-center">
                                The commit message will appear here.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};