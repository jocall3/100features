import React, { useState, useMemo } from 'react';
import { CloudIcon } from '../icons/FeatureIcons';

interface SSGConfig {
    basePath: string;
    buildDir: string;
    devPort: number;
    useMarkdown: boolean;
    useSass: boolean;
}

export const StaticSiteGeneratorUI: React.FC = () => {
    const [config, setConfig] = useState<SSGConfig>({
        basePath: '/',
        buildDir: 'dist',
        devPort: 3000,
        useMarkdown: true,
        useSass: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    
    const generatedJson = useMemo(() => JSON.stringify(config, null, 2), [config]);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(generatedJson);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CloudIcon />
                    <span className="ml-3">Static Site Generator UI</span>
                </h1>
                <p className="text-slate-400 mt-1">Configure options for a mock static site build process.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                 <div className="flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold">Configuration</h3>
                    <div>
                        <label htmlFor="basePath" className="block text-sm font-medium text-slate-400">Base Path</label>
                        <input type="text" name="basePath" value={config.basePath} onChange={handleChange} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                    </div>
                    <div>
                        <label htmlFor="buildDir" className="block text-sm font-medium text-slate-400">Build Directory</label>
                        <input type="text" name="buildDir" value={config.buildDir} onChange={handleChange} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                    </div>
                     <div>
                        <label htmlFor="devPort" className="block text-sm font-medium text-slate-400">Dev Server Port</label>
                        <input type="number" name="devPort" value={config.devPort} onChange={handleChange} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                    </div>
                     <div className="space-y-2 mt-2">
                        <label className="flex items-center">
                             <input type="checkbox" name="useMarkdown" checked={config.useMarkdown} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-cyan-600"/>
                             <span className="ml-2 text-slate-300">Enable Markdown Pages</span>
                        </label>
                         <label className="flex items-center">
                             <input type="checkbox" name="useSass" checked={config.useSass} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-cyan-600"/>
                             <span className="ml-2 text-slate-300">Enable SASS/SCSS Compilation</span>
                        </label>
                    </div>
                </div>
                 <div className="flex flex-col">
                     <label className="text-sm font-medium text-slate-400 mb-2">Generated config.json</label>
                     <div className="relative flex-grow">
                        <pre className="w-full h-full bg-slate-900 p-4 rounded-md text-cyan-300 text-sm overflow-auto font-mono">{generatedJson}</pre>
                        <button onClick={handleCopy} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs">Copy</button>
                    </div>
                </div>
            </div>
        </div>
    );
};