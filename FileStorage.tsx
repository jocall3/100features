import React from 'react';
import { FileCodeIcon } from '../icons/FeatureIcons.tsx';
import { FolderIcon, DocumentIcon } from '../icons/InterfaceIcons.tsx';


const fileTree = {
    name: 'src',
    type: 'folder',
    children: [
        { 
            name: 'components', type: 'folder', children: [
                { name: 'Button.tsx', type: 'file' },
                { name: 'Input.tsx', type: 'file' },
            ] 
        },
        { 
            name: 'services', type: 'folder', children: [
                { name: 'api.ts', type: 'file' },
            ]
        },
        { name: 'App.tsx', type: 'file' },
        { name: 'index.ts', type: 'file' },
    ]
};

const TreeNode: React.FC<{ node: any, level: number }> = ({ node, level }) => {
    const isFolder = node.type === 'folder';
    return (
        <div>
            <div className="flex items-center p-1.5 rounded-md hover:bg-slate-800" style={{ paddingLeft: `${level * 1.5}rem` }}>
                <div className="mr-2 text-slate-500">
                    {isFolder ? <FolderIcon /> : <DocumentIcon />}
                </div>
                <span>{node.name}</span>
            </div>
            {isFolder && node.children.map((child: any) => <TreeNode key={child.name} node={child} level={level + 1} />)}
        </div>
    )
};

export const FileStorage: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <FileCodeIcon />
                    <span className="ml-3">File Storage (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of a file tree explorer.</p>
            </header>
            <div className="flex-grow bg-slate-900 p-4 rounded-lg font-sans text-sm overflow-y-auto">
                <TreeNode node={fileTree} level={0} />
            </div>
        </div>
    );
};