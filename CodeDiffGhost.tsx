// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useEffect } from 'react';
import { EyeIcon } from '../icons/FeatureIcons.tsx';

const oldCode = `function UserProfile({ user }) {
  return (
    <div className="profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}`;

const newCode = `function UserProfile({ user }) {
  const { name, email, avatar } = user;
  return (
    <div className="profile-card">
      <img src={avatar} alt={name} />
      <h2>{name}</h2>
      <a href={\`mailto:\${email}\`}>{email}</a>
    </div>
  );
}`;

export const CodeDiffGhost: React.FC = () => {
    const [typedCode, setTypedCode] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (isRunning) {
            setTypedCode('');
            const intervalId = window.setInterval(() => {
                setTypedCode(prev => {
                    if (prev.length < newCode.length) {
                        return newCode.substring(0, prev.length + 1);
                    }
                    window.clearInterval(intervalId);
                    setIsRunning(false);
                    return newCode;
                });
            }, 20);
            return () => window.clearInterval(intervalId);
        }
    }, [isRunning]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <EyeIcon />
                    <span className="ml-3">Code Diff Ghost (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation showing code changes with a "ghost typing" effect.</p>
            </header>
            <div className="flex justify-center mb-4">
                <button
                    onClick={() => setIsRunning(true)}
                    disabled={isRunning}
                    className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md disabled:bg-slate-600"
                >
                    {isRunning ? 'Visualizing...' : 'Show Changes'}
                </button>
            </div>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden font-mono text-sm">
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Before</label>
                    <pre className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md text-red-300 whitespace-pre-wrap">
                        {oldCode}
                    </pre>
                </div>
                 <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">After</label>
                     <pre className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md text-green-300 whitespace-pre-wrap">
                        {typedCode}<span className="animate-pulse">|</span>
                    </pre>
                </div>
            </div>
        </div>
    );
};