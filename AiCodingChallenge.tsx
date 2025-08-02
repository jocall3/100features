import React, { useState, useCallback } from 'react';
import { generateCodingChallenge } from '../../services/geminiService.ts';
import { BeakerIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';
import { marked } from 'marked';

export const AiCodingChallenge: React.FC = () => {
    const [challenge, setChallenge] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setChallenge('');
        try {
            const result = await generateCodingChallenge();
            setChallenge(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate challenge: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <BeakerIcon />
                        <span className="ml-3">AI Coding Challenge Generator</span>
                    </h1>
                    <p className="text-slate-400 mt-1">Generate a unique coding problem to test your skills.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="flex items-center justify-center px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? <LoadingSpinner /> : 'Generate New Challenge'}
                </button>
            </header>
            <div className="flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto">
                {isLoading && (
                     <div className="flex items-center justify-center h-full">
                        <LoadingSpinner />
                     </div>
                )}
                {error && <p className="text-red-400">{error}</p>}
                {challenge && !isLoading && (
                    <div
                        className="prose prose-sm prose-invert max-w-none prose-headings:text-slate-200 prose-p:text-slate-300 prose-strong:text-slate-100 prose-code:text-cyan-300 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-slate-700"
                        dangerouslySetInnerHTML={{ __html: marked(challenge) }}
                    />
                )}
                 {!isLoading && !challenge && !error && (
                    <div className="text-slate-500 h-full flex items-center justify-center">
                        Click "Generate New Challenge" to start.
                    </div>
                )}
            </div>
        </div>
    );
};