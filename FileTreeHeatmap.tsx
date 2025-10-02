// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';
import { ChartBarIcon } from '../icons/FeatureIcons.tsx';

const mockFileTree = {
  name: 'src',
  type: 'folder',
  activity: 100,
  children: [
    { name: 'index.ts', type: 'file', activity: 10 },
    {
      name: 'components',
      type: 'folder',
      activity: 80,
      children: [
        { name: 'Button.tsx', type: 'file', activity: 75 },
        { name: 'Input.tsx', type: 'file', activity: 25 },
        { name: 'Sidebar.tsx', type: 'file', activity: 80 },
      ],
    },
    {
      name: 'services',
      type: 'folder',
      activity: 50,
      children: [{ name: 'api.ts', type: 'file', activity: 50 }],
    },
    { name: 'App.tsx', type: 'file', activity: 95 },
  ],
};

const FileNode: React.FC<{ node: any, level: number }> = ({ node, level }) => {
    const isFolder = node.type === 'folder';
    const hasChildren = isFolder && node.children && node.children.length > 0;
    const colorIntensity = Math.min(100, node.activity) / 100;
    
    // HSL: Hue=0(red) to 120(green). We map 0 activity to 60(yellow) and 100 activity to 0(red).
    const hue = 60 * (1 - colorIntensity);
    const color = `hsl(${hue}, 80%, 50%)`;

    return (
        <div style={{ marginLeft: `${level * 20}px` }}>
            <div className="flex items-center p-1 rounded-md">
                <div style={{ backgroundColor: color, opacity: 0.6 }} className="w-4 h-4 rounded-sm mr-2 flex-shrink-0"></div>
                <span>{node.name}</span>
            </div>
            {hasChildren && (
                <div>
                    {node.children.map((child: any, index: number) => (
                        <FileNode key={index} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const FileTreeHeatmap: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ChartBarIcon />
                    <span className="ml-3">File Tree Heatmap (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation visualizing file change frequency (red = hot, green = cold).</p>
            </header>
            <div className="flex-grow bg-slate-900 p-4 rounded-lg font-mono text-sm overflow-y-auto">
                <FileNode node={mockFileTree} level={0} />
            </div>
        </div>
    );
};