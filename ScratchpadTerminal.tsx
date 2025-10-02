// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';
import { TerminalIcon } from '../icons/FeatureIcons.tsx';
import TerminalComponent from '../Terminal.tsx';

export const ScratchpadTerminal: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <TerminalIcon />
                    <span className="ml-3">Scratchpad Terminal</span>
                </h1>
                <p className="text-slate-400 mt-1">An isolated terminal for quick tests and experiments.</p>
            </header>
            <div className="flex-grow bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                <TerminalComponent initialMessage="Welcome to the Scratchpad Terminal. This is a temporary, isolated environment." />
            </div>
        </div>
    );
};