// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import { LockClosedIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';

const mockVulnerabilities = [
    { id: 1, file: 'server.js', line: 42, severity: 'High', issue: 'Potential ReDoS in regex' },
    { id: 2, file: 'package.json', line: 15, severity: 'Medium', issue: 'Outdated dependency: old-lib@1.2.3' },
    { id: 3, file: 'components/Login.tsx', line: 88, severity: 'Low', issue: 'Missing CSRF token validation' },
];

export const SecurityScanner: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [results, setResults] = useState<typeof mockVulnerabilities | null>(null);

    const startScan = () => {
        setIsScanning(true);
        setResults(null);
        setTimeout(() => {
            setResults(mockVulnerabilities);
            setIsScanning(false);
        }, 2000);
    };

    const getSeverityClass = (severity: string) => {
        if (severity === 'High') return 'text-red-400';
        if (severity === 'Medium') return 'text-yellow-400';
        return 'text-green-400';
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <LockClosedIcon />
                        <span className="ml-3">Security Scanner (Simulation)</span>
                    </h1>
                    <p className="text-slate-400 mt-1">A simulation of a project security scanner.</p>
                </div>
                 <button
                    onClick={startScan}
                    disabled={isScanning}
                    className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md disabled:bg-slate-600"
                >
                    {isScanning ? <LoadingSpinner/> : 'Start Scan'}
                </button>
            </header>
            <div className="flex-grow bg-slate-900/50 p-4 rounded-lg overflow-y-auto">
                 {isScanning && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                 {!isScanning && !results && <div className="flex items-center justify-center h-full text-slate-500">Click "Start Scan" to check for vulnerabilities.</div>}
                 {results && (
                     <table className="w-full text-sm text-left">
                        <thead>
                            <tr>
                                <th className="p-2">Severity</th>
                                <th className="p-2">File</th>
                                <th className="p-2">Line</th>
                                <th className="p-2">Issue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(res => (
                                <tr key={res.id} className="border-t border-slate-800">
                                    <td className={`p-2 font-bold ${getSeverityClass(res.severity)}`}>{res.severity}</td>
                                    <td className="p-2 font-mono text-cyan-300">{res.file}</td>
                                    <td className="p-2">{res.line}</td>
                                    <td className="p-2">{res.issue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 )}
            </div>
        </div>
    );
};