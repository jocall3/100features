import React, { useState, useEffect } from 'react';
import { BugAntIcon } from '../icons/FeatureIcons';

interface Worker {
    id: number;
    name: string;
    status: 'running' | 'idle' | 'terminated';
    messages: string[];
}

const initialWorkers: Worker[] = [
    { id: 1, name: 'image-processor.js', status: 'running', messages: [] },
    { id: 2, name: 'data-cruncher.js', status: 'idle', messages: [] },
    { id: 3, name: 'asset-loader.js', status: 'terminated', messages: ['Loaded 10 assets.'] },
];

export const WorkerThreadDebugger: React.FC = () => {
    const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
    const [selectedWorker, setSelectedWorker] = useState<Worker>(initialWorkers[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setWorkers(prev => prev.map(w => {
                if (w.id === 1 && w.status === 'running') {
                    return { ...w, messages: [...w.messages, `Processed chunk ${Date.now()}`] };
                }
                return w;
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <BugAntIcon />
                    <span className="ml-3">Worker Thread Debugger (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation for inspecting mock Web Workers.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                 <aside className="lg:col-span-1 bg-slate-900 p-2 rounded-lg flex flex-col">
                     <h3 className="font-bold p-2">Active Workers</h3>
                    <div className="space-y-1 flex-grow overflow-y-auto">
                        {workers.map(worker => (
                            <button 
                                key={worker.id} 
                                onClick={() => setSelectedWorker(worker)}
                                className={`w-full text-left p-2 rounded-md ${selectedWorker.id === worker.id ? 'bg-cyan-500/20' : 'hover:bg-slate-800'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-mono text-sm">{worker.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${worker.status === 'running' ? 'bg-green-500/20 text-green-300' : worker.status === 'idle' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>{worker.status}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>
                 <main className="lg:col-span-2 bg-slate-800/50 p-4 rounded-lg flex flex-col">
                    <h3 className="text-lg font-bold mb-2">Logs for <span className="text-cyan-400">{selectedWorker.name}</span></h3>
                    <div className="flex-grow overflow-y-auto bg-slate-900 rounded p-2 font-mono text-xs">
                        {selectedWorker.messages.length > 0 ? (
                            selectedWorker.messages.map((msg, i) => <div key={i}>{msg}</div>)
                        ) : (
                             <div className="text-slate-500">No messages logged.</div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};