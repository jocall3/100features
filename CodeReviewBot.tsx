import React, { useState, useCallback } from 'react';
import { reviewCode } from '../../services/geminiService.ts';
import { CpuChipIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';
import { marked } from 'marked';

const exampleCode = `function UserList(users) {
  if (users.length = 0) {
    return "no users";
  } else {
    return (
      users.map(u => {
        return <li>{u.name}</li>
      })
    )
  }
}`;

export const CodeReviewBot: React.FC = () => {
    const [code, setCode] = useState<string>(exampleCode);
    const [review, setReview] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerate = useCallback(async () => {
        if (!code.trim()) {
            setError('Please enter some code to review.');
            return;
        }
        setIsLoading(true);
        setError('');
        setReview('');
        try {
            const result = await reviewCode(code);
            setReview(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to get review: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [code]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CpuChipIcon />
                    <span className="ml-3">AI Code Review Bot</span>
                </h1>
                <p className="text-slate-400 mt-1">Get an automated code review from Gemini.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full">
                    <label htmlFor="code-input" className="text-sm font-medium text-slate-400 mb-2">Code to Review</label>
                    <textarea
                        id="code-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Paste your code here..."
                        className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-cyan-300"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400 disabled:bg-slate-600"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Request Review'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">AI Feedback</label>
                    <div className="flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto">
                        {isLoading && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-400">{error}</p>}
                        {review && !isLoading && (
                            <div
                                className="prose prose-sm prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: marked(review) }}
                            />
                        )}
                         {!isLoading && !review && !error && <div className="text-slate-500 h-full flex items-center justify-center">Review will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};