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
        setError(''); // Clear any previous error
        setChallenge(''); // Clear any previous challenge
        try {
            const result = await generateCodingChallenge();
            setChallenge(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Something went wrong while generating the challenge. Please try again. (Details: ${errorMessage})`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-full" aria-live="polite" aria-busy="true">
                    <LoadingSpinner />
                    <span className="sr-only">Loading coding challenge...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="p-4 bg-red-900/50 border border-red-700 rounded-md text-red-300 mb-4 flex flex-col items-center justify-center text-center h-full"
                >
                    <p className="font-bold text-xl mb-2">Oops! Something went wrong.</p>
                    <p className="text-lg mb-4">{error}</p>
                    <button
                        onClick={handleGenerate}
                        className="px-6 py-3 bg-red-700 text-white font-bold rounded-md hover:bg-red-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        if (challenge) {
            return (
                <div
                    className="prose prose-sm prose-invert max-w-none prose-headings:text-slate-200 prose-p:text-slate-300 prose-strong:text-slate-100 prose-code:text-cyan-300 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-slate-700"
                    dangerouslySetInnerHTML={{ __html: marked(challenge) }}
                    aria-live="polite"
                />
            );
        }

        return (
            <div className="text-slate-500 h-full flex items-center justify-center text-center text-lg" aria-live="polite">
                Click "Generate New Challenge" to get started!
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="mb-4 sm:mb-0">
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <BeakerIcon className="h-8 w-8 text-cyan-400" />
                        <span className="ml-3">AI Coding Challenge Generator</span>
                    </h1>
                    <p className="text-slate-400 mt-1">Generate a unique coding problem to test your skills.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="flex items-center justify-center px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <LoadingSpinner className="mr-2" />
                            <span>Generating...</span>
                        </>
                    ) : (
                        'Generate New Challenge'
                    )}
                </button>
            </header>
            <div className="flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};