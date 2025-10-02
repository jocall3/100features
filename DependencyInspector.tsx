// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';
import { BugAntIcon } from '../icons/FeatureIcons.tsx';

const mockDeps = [
    { name: 'react', version: '18.2.0', status: 'ok' },
    { name: '@google/genai', version: '1.12.0', status: 'ok' },
    { name: 'old-library', version: '1.3.4', status: 'outdated' },
    { name: 'conflicting-dep', version: '2.1.0', status: 'conflict' },
    { name: 'xterm', version: '5.5.0', status: 'ok' },
    { name: 'marked', version: '13.0.2', status: 'ok' },
];

export const DependencyInspector: React.FC = () => {

    const getStatusIndicator = (status: string) => {
        switch (status) {
            case 'ok': return <div className="w-3 h-3 rounded-full bg-green-500" title="OK"></div>;
            case 'outdated': return <div className="w-3 h-3 rounded-full bg-yellow-500" title="Outdated"></div>;
            case 'conflict': return <div className="w-3 h-3 rounded-full bg-red-500" title="Conflict"></div>;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <BugAntIcon />
                    <span className="ml-3">Dependency Inspector (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation that scans for outdated or conflicting packages.</p>
            </header>
            <div className="flex-grow overflow-y-auto bg-slate-900 p-4 rounded-lg">
                <div className="space-y-2">
                    {mockDeps.map(dep => (
                        <div key={dep.name} className="bg-slate-800/50 p-3 rounded-md flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                {getStatusIndicator(dep.status)}
                                <span className="font-bold text-slate-200">{dep.name}</span>
                            </div>
                            <span className="font-mono text-sm text-slate-400">{dep.version}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};