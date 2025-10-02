// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import { GitBranchIcon } from '../icons/FeatureIcons.tsx';

export const PrGenerator: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fromBranch, setFromBranch] = useState('feature/new-login');
    const [toBranch, setToBranch] = useState('main');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 3000);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <GitBranchIcon />
                    <span className="ml-3">Pull Request Generator (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simple form to draft a pull request.</p>
            </header>
            {isSubmitted ? (
                 <div className="flex-grow flex items-center justify-center text-center bg-green-500/10 text-green-300 rounded-lg">
                    <div>
                        <h2 className="text-2xl font-bold">Pull Request Created!</h2>
                        <p>Your PR from {fromBranch} to {toBranch} has been submitted.</p>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg flex items-center gap-4">
                        <input type="text" value={fromBranch} onChange={e => setFromBranch(e.target.value)} className="px-3 py-1.5 rounded-md bg-slate-700 text-sm font-mono"/>
                        <span className="font-bold text-slate-400">→</span>
                         <input type="text" value={toBranch} onChange={e => setToBranch(e.target.value)} className="px-3 py-1.5 rounded-md bg-slate-700 text-sm font-mono"/>
                    </div>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-400">Title</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                    </div>
                    <div className="flex-grow flex flex-col">
                        <label htmlFor="description" className="block text-sm font-medium text-slate-400">Description (Markdown supported)</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 flex-grow p-3 rounded-md bg-slate-800 border border-slate-700 resize-none"/>
                    </div>
                    <button type="submit" className="w-full px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md">Create Pull Request</button>
                </form>
            )}
        </div>
    );
};