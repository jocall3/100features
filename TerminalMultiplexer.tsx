// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';
import { TerminalIcon } from '../icons/FeatureIcons.tsx';
import TerminalComponent from '../Terminal.tsx';

export const TerminalMultiplexer: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <TerminalIcon />
                    <span className="ml-3">Terminal Multiplexer (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">Run multiple terminal sessions side by side.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 h-full overflow-hidden">
                <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                     <TerminalComponent initialMessage="Terminal 1" />
                </div>
                <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                     <TerminalComponent initialMessage="Terminal 2" />
                </div>
            </div>
        </div>
    );
};