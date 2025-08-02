import React, { useState } from 'react';
import { FileCodeIcon } from '../icons/FeatureIcons.tsx';

const mockDocs = {
    'React': {
        'Introduction': 'React is a JavaScript library for building user interfaces.',
        'Hooks': 'Hooks are functions that let you “hook into” React state and lifecycle features from function components.'
    },
    'MDN': {
        'Array.prototype.map()': 'The map() method creates a new array populated with the results of calling a provided function on every element in the calling array.',
        'Flexbox': 'The Flexbox Layout module aims at providing a more efficient way to lay out, align and distribute space among items in a container.'
    }
};

type DocSet = keyof typeof mockDocs;

export const OfflineDocsBrowser: React.FC = () => {
    const [activeSet, setActiveSet] = useState<DocSet>('React');
    const [activeTopic, setActiveTopic] = useState('Introduction');

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <FileCodeIcon />
                    <span className="ml-3">Offline Docs Browser (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of browsing downloaded documentation.</p>
            </header>
            <div className="flex-grow flex gap-6 min-h-0">
                <aside className="w-1/3 bg-slate-800/50 p-4 rounded-lg flex flex-col">
                    <h3 className="font-bold mb-2">Docsets</h3>
                    {Object.keys(mockDocs).map(name => (
                         <button key={name} onClick={() => { setActiveSet(name as DocSet); setActiveTopic(Object.keys(mockDocs[name as DocSet])[0]); }} className={`w-full text-left px-3 py-2 rounded-md ${activeSet === name ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-700/50'}`}>
                            {name}
                        </button>
                    ))}
                     <h3 className="font-bold mb-2 mt-4 pt-4 border-t border-slate-700">Topics</h3>
                     <ul className="space-y-1 flex-grow overflow-y-auto">
                        {Object.keys(mockDocs[activeSet]).map(topic => (
                            <li key={topic}>
                                <button onClick={() => setActiveTopic(topic)} className={`w-full text-left px-3 py-1 rounded-md text-sm ${activeTopic === topic ? 'text-cyan-300' : 'hover:text-slate-300'}`}>
                                    {topic}
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>
                <main className="w-2/3 bg-slate-900 p-6 rounded-lg overflow-y-auto">
                     <h2 className="text-2xl font-bold mb-4 text-slate-100">{activeTopic}</h2>
                     <p className="text-slate-300 leading-relaxed">
                        {mockDocs[activeSet][activeTopic as keyof typeof mockDocs[DocSet]]}
                     </p>
                </main>
            </div>
        </div>
    );
};