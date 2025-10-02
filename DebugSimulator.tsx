// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useEffect } from 'react';
import { BugAntIcon } from '../icons/FeatureIcons.tsx';

const mockEvents = [
    { time: 0, type: 'start', description: 'Script execution started' },
    { time: 50, type: 'call', description: '`calculateTotal` called', stack: ['global'], scope: { items: '[...]', tax: '0.07' } },
    { time: 150, type: 'call', description: '`Array.reduce` called', stack: ['calculateTotal', 'global'], scope: { accumulator: 0, current: '{...}' } },
    { time: 200, type: 'update', description: '`accumulator` = 10', stack: ['reduce', 'calculateTotal', 'global'], scope: { accumulator: 10 } },
    { time: 250, type: 'update', description: '`accumulator` = 30', stack: ['reduce', 'calculateTotal', 'global'], scope: { accumulator: 30 } },
    { time: 300, type: 'return', description: '`Array.reduce` returns 30', stack: ['calculateTotal', 'global'], scope: { subtotal: 30 } },
    { time: 350, type: 'return', description: '`calculateTotal` returns 32.1', stack: ['global'], scope: { result: 32.1 } },
    { time: 400, type: 'end', description: 'Script execution finished' },
];

export const DebugSimulator: React.FC = () => {
    const [time, setTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (isPlaying) {
            const intervalId = window.setInterval(() => {
                setTime(prev => {
                    if (prev >= 400) {
                        setIsPlaying(false);
                        return 400;
                    }
                    return prev + 10;
                });
            }, 100);
            return () => window.clearInterval(intervalId);
        }
    }, [isPlaying]);

    const activeEvent = mockEvents.slice().reverse().find(e => e.time <= time);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <BugAntIcon />
                    <span className="ml-3">Timeline Debugger (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A visual simulation of a time-travel debugger concept.</p>
            </header>
            <div className="flex-grow flex flex-col gap-6 min-h-0">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="px-4 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md">{isPlaying ? 'Pause' : 'Play'}</button>
                        <input type="range" min="0" max="400" step="1" value={time} onChange={e => setTime(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="font-mono w-20 text-right">{time}ms</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow min-h-0">
                    <div className="md:col-span-1 flex flex-col gap-4">
                        <div className="bg-slate-800/50 p-4 rounded-lg flex-1">
                            <h3 className="font-bold mb-2">Call Stack</h3>
                            <ul className="space-y-1 font-mono text-sm">
                                {activeEvent?.stack?.map((fn, i) => (
                                    <li key={i} className={`px-2 py-1 rounded ${i === 0 ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}>{fn}</li>
                                )) || <li className="text-slate-500">empty</li>}
                            </ul>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg flex-1">
                            <h3 className="font-bold mb-2">Scope Variables</h3>
                             <pre className="font-mono text-sm text-yellow-300">{JSON.stringify(activeEvent?.scope, null, 2) || '{}'}</pre>
                        </div>
                    </div>
                    <div className="md:col-span-2 bg-slate-900 p-4 rounded-lg overflow-y-auto">
                        <h3 className="font-bold mb-2">Event Log</h3>
                        <ul className="space-y-2 font-mono text-sm">
                           {mockEvents.map(e => (
                               <li key={e.time} className={`flex gap-4 p-2 rounded transition-colors ${e.time <= time ? 'bg-slate-800' : 'opacity-50'}`}>
                                   <span className="w-12 text-slate-500">{e.time}ms</span>
                                   <span className="text-slate-300">{e.description}</span>
                               </li>
                           ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};