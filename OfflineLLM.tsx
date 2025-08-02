import React from 'react';
import { CpuChipIcon } from '../icons/FeatureIcons.tsx';

export const OfflineLLM: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CpuChipIcon />
                    <span className="ml-3">Offline LLM Assistant (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of using a local language model for suggestions.</p>
            </header>
            <div className="flex-grow flex flex-col gap-4 border-2 border-dashed border-slate-700 rounded-lg p-6">
                <div className="flex-grow bg-slate-800/50 p-4 rounded-md text-slate-400">
                    &gt; Offline model loaded successfully. Ready for prompts.
                </div>
                <textarea
                    placeholder="Ask the local model..."
                    className="p-3 bg-slate-800 border border-slate-700 rounded-md resize-none h-24"
                    disabled
                />
                <button
                    disabled
                    className="w-full flex items-center justify-center px-6 py-3 bg-slate-600 text-slate-400 font-bold rounded-md cursor-not-allowed"
                >
                    Submit (Disabled)
                </button>
                 <p className="text-xs text-center text-slate-500">This is a UI simulation. An actual implementation would require running a local model like Llama or Ollama.</p>
            </div>
        </div>
    );
};