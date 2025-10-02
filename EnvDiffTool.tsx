// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useMemo } from 'react';
import { LockClosedIcon } from '../icons/FeatureIcons.tsx';

const parseEnv = (text: string): Map<string, string> => {
    const map = new Map<string, string>();
    text.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
                const key = trimmed.substring(0, eqIndex);
                const value = trimmed.substring(eqIndex + 1);
                map.set(key, value);
            }
        }
    });
    return map;
};

export const EnvDiffTool: React.FC = () => {
    const [envA, setEnvA] = useState('API_KEY=123\nDB_HOST=localhost\nNODE_ENV=development');
    const [envB, setEnvB] = useState('API_KEY=456\nDB_HOST=localhost\nFEATURE_FLAG=true');

    const diff = useMemo(() => {
        const mapA = parseEnv(envA);
        const mapB = parseEnv(envB);
        const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);
        const result: { key: string; valueA: string; valueB: string; type: 'added' | 'removed' | 'changed' | 'same' }[] = [];

        allKeys.forEach(key => {
            const valA = mapA.get(key);
            const valB = mapB.get(key);
            if (valA !== undefined && valB !== undefined) {
                result.push({ key, valueA: valA, valueB: valB, type: valA === valB ? 'same' : 'changed' });
            } else if (valA !== undefined) {
                result.push({ key, valueA: valA, valueB: '', type: 'removed' });
            } else if (valB !== undefined) {
                result.push({ key, valueA: '', valueB: valB, type: 'added' });
            }
        });
        return result;
    }, [envA, envB]);

    const getRowClass = (type: string) => {
        switch (type) {
            case 'added': return 'bg-green-500/10';
            case 'removed': return 'bg-red-500/10';
            case 'changed': return 'bg-yellow-500/10';
            default: return 'bg-slate-800/50';
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <LockClosedIcon />
                    <span className="ml-3">Environment Diff Tool</span>
                </h1>
                <p className="text-slate-400 mt-1">Compare two .env files to see what's changed.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full">
                     <label htmlFor="env-a" className="text-sm font-medium text-slate-400 mb-2">Environment A</label>
                     <textarea id="env-a" value={envA} onChange={e => setEnvA(e.target.value)} className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm"/>
                </div>
                 <div className="flex flex-col h-full">
                     <label htmlFor="env-b" className="text-sm font-medium text-slate-400 mb-2">Environment B</label>
                     <textarea id="env-b" value={envB} onChange={e => setEnvB(e.target.value)} className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm"/>
                </div>
            </div>
             <div className="mt-6">
                <h3 className="text-xl font-bold mb-2">Differences</h3>
                <div className="bg-slate-900 p-4 rounded-lg overflow-y-auto max-h-64 font-mono text-sm">
                    {diff.map(({ key, valueA, valueB, type }) => (
                         <div key={key} className={`flex p-2 rounded ${getRowClass(type)}`}>
                            <span className="w-1/3 text-slate-400">{key}</span>
                             <span className="w-1/3 text-slate-300">{type === 'added' ? '' : valueA}</span>
                             <span className="w-1/3 text-slate-300">{type === 'removed' ? '' : valueB}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};