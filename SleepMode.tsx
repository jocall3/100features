import React, { useState } from 'react';
import { CloudIcon } from '../icons/FeatureIcons.tsx';

export const SleepMode: React.FC = () => {
    const [isSleeping, setIsSleeping] = useState(false);

    if (isSleeping) {
        return (
            <div 
                className="absolute inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center text-center"
                onClick={() => setIsSleeping(false)}
            >
                <div className="text-6xl mb-4 animate-pulse">😴</div>
                <h1 className="text-3xl font-bold text-slate-200 mb-2">
                    Session Paused
                </h1>
                <p className="text-lg text-slate-400">Click anywhere to wake up.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="text-6xl mb-4" aria-hidden="true">
                <CloudIcon />
            </div>
            <h1 className="text-3xl font-bold text-slate-200 mb-2">
                Sleep Mode
            </h1>
            <p className="text-lg mb-4 max-w-md">
                Freeze and restore your full session state.
            </p>
            <button
                onClick={() => setIsSleeping(true)}
                className="px-8 py-4 bg-cyan-500 text-slate-900 font-bold rounded-lg text-lg hover:bg-cyan-400"
            >
                Enter Sleep Mode
            </button>
        </div>
    );
};