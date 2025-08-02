import React, { useState } from 'react';
import { GitBranchIcon } from '../icons/FeatureIcons.tsx';

const mockSnapshots = [
    { id: 4, timestamp: '2024-05-20 14:30:15', message: 'feat: add user profiles' },
    { id: 3, timestamp: '2024-05-20 11:15:05', message: 'fix: correct login bug' },
    { id: 2, timestamp: '2024-05-19 18:00:00', message: 'refactor: simplify API service' },
    { id: 1, timestamp: '2024-05-18 10:00:00', message: 'Initial commit' },
];

export const VersionSnapshotRollbacks: React.FC = () => {
    const [currentVersion, setCurrentVersion] = useState(4);
    const [feedback, setFeedback] = useState('');
    
    const handleRollback = (id: number) => {
        setCurrentVersion(id);
        setFeedback(`Rolled back to version ${id}!`);
        setTimeout(() => setFeedback(''), 3000);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <GitBranchIcon />
                        <span className="ml-3">Version Snapshots (Simulation)</span>
                    </h1>
                    <p className="text-slate-400 mt-1">A simulation for rolling back to previous versions.</p>
                </div>
                {feedback && <span className="text-green-400 bg-green-500/10 px-3 py-1 rounded-md">{feedback}</span>}
            </header>
             <div className="flex-grow bg-slate-900/50 p-4 rounded-lg overflow-y-auto">
                <div className="space-y-3">
                {mockSnapshots.map(snapshot => (
                    <div key={snapshot.id} className={`p-4 rounded-lg flex justify-between items-center transition-colors ${currentVersion === snapshot.id ? 'bg-cyan-500/20 border border-cyan-500' : 'bg-slate-800'}`}>
                        <div>
                            <p className="font-bold text-slate-200">{snapshot.message}</p>
                            <p className="text-xs text-slate-400 font-mono mt-1">{snapshot.timestamp}</p>
                        </div>
                        <button
                            onClick={() => handleRollback(snapshot.id)}
                            disabled={currentVersion === snapshot.id}
                            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-sm disabled:bg-slate-500 disabled:cursor-not-allowed"
                        >
                            {currentVersion === snapshot.id ? 'Current' : 'Rollback'}
                        </button>
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
};