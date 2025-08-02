
import React, { useState, useMemo } from 'react';
import { GitBranchIcon } from '../icons/FeatureIcons';

const sampleCommits = `feat: add user login page
fix: correct typo in header
docs: update readme with setup instructions
feat(api): implement user endpoint
chore: upgrade dependencies
fix(button): prevent double click`;

export const ChangelogGenerator: React.FC = () => {
    const [commits, setCommits] = useState(sampleCommits);

    const changelog = useMemo(() => {
        const lines = commits.split('\n').filter(line => line.trim() !== '');
        const features = lines.filter(l => l.startsWith('feat')).map(l => `- ${l.substring(l.indexOf(':') + 2)}`);
        const fixes = lines.filter(l => l.startsWith('fix')).map(l => `- ${l.substring(l.indexOf(':') + 2)}`);
        
        let md = '# Changelog\n\n';
        if (features.length > 0) {
            md += '## ✨ Features\n\n' + features.join('\n') + '\n\n';
        }
        if (fixes.length > 0) {
            md += '## 🐛 Bug Fixes\n\n' + fixes.join('\n') + '\n\n';
        }
        return md;
    }, [commits]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <GitBranchIcon />
                    <span className="ml-3">Changelog Generator</span>
                </h1>
                <p className="text-slate-400 mt-1">Generate a markdown changelog from a list of conventional commits.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full">
                    <label htmlFor="commit-input" className="text-sm font-medium text-slate-400 mb-2">Commit Messages (one per line)</label>
                    <textarea
                        id="commit-input"
                        value={commits}
                        onChange={(e) => setCommits(e.target.value)}
                        className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm"
                    />
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Generated Changelog.md</label>
                    <div className="relative flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans text-slate-200">{changelog}</pre>
                        <button onClick={() => navigator.clipboard.writeText(changelog)} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs">Copy</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
