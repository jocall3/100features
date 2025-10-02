// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';
import { LinkIcon } from '../icons/FeatureIcons.tsx';

const Node: React.FC<{ title: string, x: number, y: number }> = ({ title, x, y }) => (
    <div
        className="absolute bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
        {title}
    </div>
);

const Edge: React.FC<{ x1: number, y1: number, x2: number, y2: number }> = ({ x1, y1, x2, y2 }) => (
    <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke="#475569" strokeWidth="2" />
);


export const Linker: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <LinkIcon />
                    <span className="ml-3">Linker (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of a visual dependency map.</p>
            </header>
            <div className="flex-grow relative bg-slate-900/50 p-8 rounded-lg border-2 border-dashed border-slate-700">
                <svg className="absolute inset-0 w-full h-full">
                    <Edge x1={25} y1={25} x2={50} y2={50} />
                    <Edge x1={75} y1={25} x2={50} y2={50} />
                    <Edge x1={50} y1={50} x2={50} y2={80} />
                </svg>
                <Node title="apiService.ts" x={25} y={25} />
                <Node title="authHook.ts" x={75} y={25} />
                <Node title="LoginComponent.tsx" x={50} y={50} />
                <Node title="App.tsx" x={50} y={80} />
            </div>
        </div>
    );
};