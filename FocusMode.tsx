import React from 'react';
import { EyeIcon } from '../icons/FeatureIcons.tsx';

interface FocusModeProps {
    toggleFocusMode?: (isFocused: boolean) => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({ toggleFocusMode }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
            <div className="text-6xl mb-4" aria-hidden="true">
                <EyeIcon />
            </div>
            <h1 className="text-3xl font-bold text-slate-200 mb-2">
                Focus Mode
            </h1>
            <p className="text-lg mb-4 max-w-md">
                Hide all UI distractions and focus on the current feature.
            </p>
            <button
                onClick={() => toggleFocusMode?.(true)}
                className="px-8 py-4 bg-cyan-500 text-slate-900 font-bold rounded-lg text-lg hover:bg-cyan-400"
            >
                Enter Focus Mode
            </button>
             <p className="text-xs text-slate-500 mt-4">Press 'Esc' to exit.</p>
        </div>
    );
};