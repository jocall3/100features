import React from 'react';
import { ChartBarIcon } from '../icons/FeatureIcons.tsx';

const mockExecutions = [
    { name: 'renderApp', start: 0, end: 500, color: 'bg-cyan-500' },
    { name: 'fetchData', start: 50, end: 350, color: 'bg-purple-500' },
    { name: 'processData', start: 350, end: 450, color: 'bg-indigo-500' },
    { name: 'animateUI', start: 500, end: 700, color: 'bg-sky-500' },
    { name: 'longTask', start: 720, end: 980, color: 'bg-red-500' },
];
const totalTime = 1000;

export const FunctionExecutionViz: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ChartBarIcon />
                    <span className="ml-3">Function Execution Visualizer (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A Gantt-style chart showing a simulated function execution timeline.</p>
            </header>
            <div className="flex-grow bg-slate-900 p-4 rounded-lg overflow-y-auto">
                <div className="relative font-mono text-xs">
                    {/* Background Ticks */}
                    <div className="relative h-full border-b-2 border-slate-700">
                         {Array.from({ length: 11 }).map((_, i) => (
                            <div key={i} className="absolute h-full" style={{ left: `${i * 10}%` }}>
                                <div className="h-2 w-px bg-slate-600"></div>
                                <span className="absolute -bottom-5 -translate-x-1/2 text-slate-500">{i * (totalTime/10)}ms</span>
                            </div>
                        ))}
                    </div>

                    {/* Execution Blocks */}
                    <div className="mt-8 space-y-2">
                         {mockExecutions.map(exec => (
                            <div key={exec.name} className="relative h-8 flex items-center">
                                <div className="w-32 text-slate-300 truncate">{exec.name}</div>
                                <div
                                    className={`absolute h-full rounded ${exec.color} opacity-70`}
                                    style={{
                                        left: `calc(8rem + ${exec.start / totalTime * 100}%)`,
                                        width: `${(exec.end - exec.start) / totalTime * 100}%`
                                    }}
                                ></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};