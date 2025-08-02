
import React from 'react';
import { CommandLineIcon } from '../icons/FeatureIcons';

export const CommandPaletteTrigger: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
            <div className="text-6xl mb-4" aria-hidden="true">
                <CommandLineIcon />
            </div>
            <h1 className="text-3xl font-bold text-slate-200 mb-2">
                Command Palette
            </h1>
            <p className="text-lg mb-4 max-w-md">
                The Command Palette provides quick access to all features and commands.
            </p>
            <div className="bg-slate-800 text-cyan-300 border border-slate-700 rounded-lg px-6 py-4">
                <p className="font-semibold">Press <kbd className="mx-1 font-sans px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl</kbd> + <kbd className="mx-1 font-sans px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">K</kbd> to open.</p>
            </div>
        </div>
    );
};
