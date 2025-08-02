import React from 'react';
import { GitBranchIcon, BugAntIcon } from '../icons/FeatureIcons.tsx';

const mockIssues = [
    { id: 123, title: 'Button component not rendering correctly on mobile', status: 'Open', labels: [{ name: 'bug', color: 'bg-red-500' }, { name: 'ui', color: 'bg-blue-500'}] },
    { id: 124, title: 'Add dark mode toggle to settings', status: 'Open', labels: [{ name: 'feature', color: 'bg-purple-500' }] },
    { id: 121, title: 'Update documentation for API endpoints', status: 'Closed', labels: [{ name: 'documentation', color: 'bg-gray-500' }] },
];

export const GithubIssueSync: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <GitBranchIcon />
                        <span className="ml-3">GitHub Issue Sync (Simulation)</span>
                    </h1>
                    <p className="text-slate-400 mt-1">A simulation of syncing and viewing GitHub issues.</p>
                </div>
                <button className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md">Sync Issues</button>
            </header>
            <div className="flex-grow bg-slate-900/50 p-4 rounded-lg overflow-y-auto">
                <div className="space-y-3">
                    {mockIssues.map(issue => (
                        <div key={issue.id} className="bg-slate-800 p-3 rounded-md flex items-center gap-4">
                             <div className={`flex-shrink-0 ${issue.status === 'Open' ? 'text-green-400' : 'text-purple-400'}`}>
                                <BugAntIcon />
                            </div>
                            <div className="flex-grow">
                                <p className="text-slate-200">{issue.title}</p>
                                <div className="flex gap-2 mt-1">
                                    {issue.labels.map(label => (
                                        <span key={label.name} className={`px-2 py-0.5 text-xs rounded-full text-white ${label.color}`}>{label.name}</span>
                                    ))}
                                </div>
                            </div>
                            <span className={`text-sm font-bold ${issue.status === 'Open' ? 'text-green-400' : 'text-purple-400'}`}>{issue.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};