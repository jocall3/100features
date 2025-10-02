// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState } from 'react';
import { CodeBracketIcon } from '../icons/FeatureIcons';

const mockFiles = {
  'index.js': `console.log("Hello, World!");`,
  'styles.css': `body {\n  background-color: #333;\n}`,
  'README.md': `# My Project\n\nThis is a sample project.`
};

export const FileEditor: React.FC = () => {
    const [activeTab, setActiveTab] = useState('index.js');

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CodeBracketIcon />
                    <span className="ml-3">File Editor (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of a multi-tab code editor.</p>
            </header>
            <div className="flex-grow flex flex-col bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                <div className="flex bg-slate-800 border-b border-slate-700">
                    {Object.keys(mockFiles).map(filename => (
                        <button
                            key={filename}
                            onClick={() => setActiveTab(filename)}
                            className={`px-4 py-2 text-sm ${activeTab === filename ? 'bg-slate-900 text-cyan-400' : 'text-slate-400 hover:bg-slate-700/50'}`}
                        >
                            {filename}
                        </button>
                    ))}
                </div>
                <textarea
                    readOnly
                    value={mockFiles[activeTab as keyof typeof mockFiles]}
                    className="w-full h-full p-4 bg-transparent resize-none font-mono text-sm text-cyan-300 focus:outline-none"
                />
            </div>
        </div>
    );
};
