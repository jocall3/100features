// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React from 'react';
import { GitBranchIcon } from '../icons/FeatureIcons';

const Node: React.FC<{ title: string, content: string, children?: React.ReactNode }> = ({ title, content, children }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 w-64">
        <h3 className="font-bold text-cyan-400">{title}</h3>
        <p className="text-sm text-slate-300 mt-1">{content}</p>
        {children}
    </div>
);

const Arrow: React.FC = () => (
    <div className="flex items-center justify-center mx-4 text-slate-500">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
        </svg>
    </div>
);

export const GithubActionsDesigner: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <GitBranchIcon />
                    <span className="ml-3">GitHub Actions Designer (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of a visual editor for GitHub Actions workflows.</p>
            </header>
            <div className="flex-grow flex flex-col items-center justify-center bg-slate-900/50 p-8 rounded-lg border-2 border-dashed border-slate-700">
                <div className="flex items-start">
                    <Node title="on: push" content="Trigger on push to main branch" />
                    <Arrow />
                    <div className="flex flex-col gap-4">
                        <Node title="jobs: build" content="Run on ubuntu-latest">
                            <div className="mt-2 text-xs font-mono bg-slate-900 p-2 rounded">
                                <div>- uses: actions/checkout@v2</div>
                                <div>- name: Setup Node</div>
                                <div>- run: npm install</div>
                                <div>- run: npm run build</div>
                            </div>
                        </Node>
                        <Node title="jobs: test" content="needs: build">
                            <div className="mt-2 text-xs font-mono bg-slate-900 p-2 rounded">
                                <div>- run: npm test</div>
                            </div>
                        </Node>
                    </div>
                </div>
            </div>
        </div>
    );
};
