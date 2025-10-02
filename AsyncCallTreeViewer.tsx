// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React from 'react';
import { ChartBarIcon } from '../icons/FeatureIcons.tsx';

const mockAsyncTree = {
    name: 'startApp',
    duration: 500,
    children: [
        {
            name: 'fetchUserData',
            duration: 300,
            children: [
                { name: 'authenticate', duration: 100, children: [] },
                { name: 'fetchProfile', duration: 150, children: [] },
            ],
        },
        {
            name: 'loadInitialAssets',
            duration: 450,
            children: [
                { name: 'loadImage.png', duration: 200, children: [] },
                { name: 'loadScript.js', duration: 250, children: [] },
            ],
        },
    ],
};

const TreeNode: React.FC<{ node: typeof mockAsyncTree, level: number }> = ({ node, level }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div>
            <div
                className="flex items-center p-2 rounded-md hover:bg-slate-800"
                style={{ marginLeft: `${level * 20}px` }}
            >
                {hasChildren && (
                    <button onClick={() => setIsOpen(!isOpen)} className="mr-2 text-slate-500 w-4 h-4">
                       {isOpen ? '▼' : '►'}
                    </button>
                )}
                 <div className="flex-grow flex items-center justify-between">
                    <span>{node.name}</span>
                    <span className="text-cyan-400">{node.duration}ms</span>
                </div>
            </div>
            {isOpen && hasChildren && (
                <div>
                    {node.children.map((child, index) => (
                        <TreeNode key={index} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};


export const AsyncCallTreeViewer: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ChartBarIcon />
                    <span className="ml-3">Async Call Tree (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">Visualize a simulated tree of asynchronous function calls.</p>
            </header>
            <div className="flex-grow bg-slate-900 p-4 rounded-lg font-mono text-sm overflow-y-auto">
                <TreeNode node={mockAsyncTree} level={0} />
            </div>
        </div>
    );
};