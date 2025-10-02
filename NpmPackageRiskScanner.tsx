// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React from 'react';
import { LockClosedIcon } from '../icons/FeatureIcons';

const mockDeps = [
    { name: 'react', version: '18.2.0', risk: 'None' },
    { name: 'express', version: '4.18.1', risk: 'Low' },
    { name: 'lodash', version: '4.17.20', risk: 'None' },
    { name: 'request', version: '2.88.2', risk: 'High', reason: 'Deprecated package' },
    { name: 'moment', version: '2.29.1', risk: 'Medium', reason: 'Legacy, large bundle' },
    { name: 'chalk', version: '5.0.1', risk: 'None' },
];

export const NpmPackageRiskScanner: React.FC = () => {
    
    const getRiskClass = (risk: string) => {
        if (risk === 'High') return 'text-red-400';
        if (risk === 'Medium') return 'text-yellow-400';
        if (risk === 'Low') return 'text-green-400';
        return 'text-slate-400';
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <LockClosedIcon />
                    <span className="ml-3">NPM Package Risk Scanner (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation that scans dependencies for security risks.</p>
            </header>
            <div className="flex-grow overflow-y-auto bg-slate-900 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-slate-800">
                        <tr>
                            <th className="p-3">Package</th>
                            <th className="p-3">Version</th>
                            <th className="p-3">Risk Level</th>
                            <th className="p-3">Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockDeps.map(dep => (
                            <tr key={dep.name} className="border-b border-slate-800">
                                <td className="p-3 font-bold text-cyan-300">{dep.name}</td>
                                <td className="p-3">{dep.version}</td>
                                <td className={`p-3 font-bold ${getRiskClass(dep.risk)}`}>{dep.risk}</td>
                                <td className="p-3 text-slate-400">{dep.reason || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
