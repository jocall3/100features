// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React from 'react';
import { GitBranchIcon } from '../icons/FeatureIcons.tsx';

const commitData = [
  { id: 'c10', branch: 'main', parent: 'c9', message: 'feat: Add user authentication' },
  { id: 'c9', branch: 'main', parent: 'c7', message: 'refactor: Simplify component logic' },
  { id: 'c8', branch: 'dev', parent: 'c6', message: 'fix: Correct layout on mobile' },
  { id: 'c7', branch: 'main', parent: 'c5', merge: 'c6', message: 'Merge branch dev into main' },
  { id: 'c6', branch: 'dev', parent: 'c4', message: 'feat: Implement new sidebar' },
  { id: 'c5', branch: 'main', parent: 'c3', message: 'docs: Update README file' },
  { id: 'c4', branch: 'dev', parent: 'c3', message: 'style: Adjust button colors' },
  { id: 'c3', branch: 'main', parent: 'c2', message: 'fix: Typo in header text' },
  { id: 'c2', branch: 'main', parent: 'c1', message: 'feat: Add basic layout' },
  { id: 'c1', branch: 'main', parent: null, message: 'Initial commit' },
];

const branchColors: { [key: string]: string } = {
  main: 'border-cyan-400',
  dev: 'border-purple-400',
};

const branchDotColors: { [key: string]: string } = {
  main: 'bg-cyan-400',
  dev: 'bg-purple-400',
};

export const VisualGitTree: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100 flex items-center">
          <GitBranchIcon />
          <span className="ml-3">Visual Git Tree (Simulation)</span>
        </h1>
        <p className="text-slate-400 mt-1">A visual representation of a sample Git commit history.</p>
      </header>
      <div className="flex-grow overflow-y-auto bg-slate-900 p-4 rounded-lg">
        <div className="space-y-4 font-mono text-sm">
          {commitData.map(commit => (
            <div key={commit.id} className={`relative flex items-center space-x-4 pl-8 border-l-2 ${branchColors[commit.branch] || 'border-slate-600'}`}>
              <div className={`absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${branchDotColors[commit.branch] || 'bg-slate-600'}`}></div>
              <span className="text-slate-500">{commit.id.substring(0, 7)}</span>
              <span className="flex-grow text-slate-300">{commit.message}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${branchDotColors[commit.branch]} text-slate-900 font-bold`}>{commit.branch}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};