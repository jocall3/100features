// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect } from 'react';
import { CloudIcon } from '../icons/FeatureIcons.tsx';

type Status = 'synced' | 'syncing' | 'error' | 'pending';
const files = ['index.html', 'styles.css', 'app.js', 'package.json', 'README.md'];

export const RemoteProjectSyncer: React.FC = () => {
    const [statuses, setStatuses] = useState<Status[]>(Array(files.length).fill('pending'));
    const [isSyncing, setIsSyncing] = useState(false);

    const getStatusIndicator = (status: Status) => {
        switch (status) {
            case 'synced': return <div className="w-5 h-5 text-green-400">✓</div>;
            case 'syncing': return <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>;
            case 'error': return <div className="w-5 h-5 text-red-400">✗</div>;
            default: return <div className="w-5 h-5 text-slate-500">-</div>;
        }
    };

    const startSync = () => {
        setIsSyncing(true);
        setStatuses(Array(files.length).fill('pending'));
        let currentFile = 0;
        
        const interval = setInterval(() => {
            setStatuses(s => s.map((status, i) => i === currentFile ? 'syncing' : status));

            setTimeout(() => {
                 setStatuses(s => s.map((status, i) => i === currentFile ? 'synced' : status));
                 currentFile++;
                 if (currentFile >= files.length) {
                    clearInterval(interval);
                    setIsSyncing(false);
                }
            }, 500);
        }, 700);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <CloudIcon />
                        <span className="ml-3">Remote Project Syncer (Simulation)</span>
                    </h1>
                    <p className="text-slate-400 mt-1">A simulation of syncing files with a remote server.</p>
                </div>
                 <button
                    onClick={startSync}
                    disabled={isSyncing}
                    className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md disabled:bg-slate-600"
                >
                    {isSyncing ? 'Syncing...' : 'Start Sync'}
                </button>
            </header>
            <div className="flex-grow bg-slate-900/50 p-4 rounded-lg overflow-y-auto">
                <div className="space-y-2">
                    {files.map((file, i) => (
                        <div key={file} className="bg-slate-800 p-3 rounded-md flex justify-between items-center font-mono text-sm">
                            <span>{file}</span>
                            {getStatusIndicator(statuses[i])}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};