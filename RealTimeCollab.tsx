// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect } from 'react';
import { LinkIcon } from '../icons/FeatureIcons.tsx';

const sampleCode = `import React from 'react';

function App() {
  return (
    <div>
      <h1>Hello, DevCore!</h1>
    </div>
  );
}

export default App;`;

const cursorsData = [
    { name: 'Alex', color: 'bg-cyan-500' },
    { name: 'Sam', color: 'bg-purple-500' },
    { name: 'Jess', color: 'bg-green-500' },
];

export const RealTimeCollab: React.FC = () => {
    const [positions, setPositions] = useState([
        { top: 50, left: 100 },
        { top: 80, left: 200 },
        { top: 120, left: 50 },
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setPositions(prev => prev.map(p => ({
                top: p.top + (Math.random() - 0.5) * 20,
                left: p.left + (Math.random() - 0.5) * 30
            })));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <LinkIcon />
                    <span className="ml-3">Real-Time Collaboration (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of a collaborative code editor with multiple cursors.</p>
            </header>
            <div className="relative flex-grow bg-slate-900 p-4 rounded-lg font-mono text-sm text-cyan-300 overflow-hidden">
                <pre>{sampleCode}</pre>
                {cursorsData.map((cursor, index) => (
                    <div
                        key={cursor.name}
                        className="absolute transition-all duration-1000 ease-linear"
                        style={{ top: positions[index].top, left: positions[index].left }}
                    >
                        <div className={`w-0.5 h-5 ${cursor.color} animate-pulse`}></div>
                        <div className={`absolute top-5 left-0 px-2 py-0.5 text-xs text-white rounded ${cursor.color}`}>{cursor.name}</div>
                    </div>
                ))}
                 <div className="absolute top-4 right-4 flex -space-x-2">
                    {cursorsData.map(c => <div key={c.name} title={c.name} className={`w-8 h-8 rounded-full ${c.color} border-2 border-slate-900`}></div>)}
                </div>
            </div>
        </div>
    );
};