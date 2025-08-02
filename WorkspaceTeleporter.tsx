import React, { useState } from 'react';
import { CloudIcon } from '../icons/FeatureIcons.tsx';

const workspaces = [
    { name: 'Work Project', path: '/Users/dev/work/project-a' },
    { name: 'Side Hustle', path: '/Users/dev/personal/side-hustle' },
    { name: 'Open Source', path: '/Users/dev/oss/cool-lib' },
    { name: 'dotfiles', path: '/Users/dev/.dotfiles' },
];

export const WorkspaceTeleporter: React.FC = () => {
    const [active, setActive] = useState('Work Project');
    const [feedback, setFeedback] = useState('');

    const teleport = (name: string) => {
        setActive(name);
        setFeedback(`Teleported to ${name}!`);
        setTimeout(() => setFeedback(''), 2000);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <CloudIcon />
                        <span className="ml-3">Workspace Teleporter</span>
                    </h1>
                    <p className="text-slate-400 mt-1">Instantly switch between your project workspaces.</p>
                </div>
                 {feedback && <span className="text-green-400 bg-green-500/10 px-3 py-1 rounded-md">{feedback}</span>}
            </header>
            <div className="flex-grow bg-slate-900/50 p-4 rounded-lg overflow-y-auto">
                <div className="space-y-3">
                {workspaces.map(ws => (
                    <button
                        key={ws.name}
                        onClick={() => teleport(ws.name)}
                        disabled={active === ws.name}
                        className="w-full text-left p-4 rounded-lg transition-colors bg-slate-800 hover:bg-slate-700/50 disabled:bg-cyan-500/20 disabled:ring-2 disabled:ring-cyan-500 disabled:cursor-default"
                    >
                        <p className="font-bold text-slate-200">{ws.name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-1">{ws.path}</p>
                    </button>
                ))}
                </div>
            </div>
        </div>
    );
};