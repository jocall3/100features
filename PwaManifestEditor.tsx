// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useMemo } from 'react';
import { CodeBracketSquareIcon } from '../icons/FeatureIcons.tsx';

interface ManifestData {
    name: string;
    short_name: string;
    start_url: string;
    display: 'standalone' | 'fullscreen' | 'minimal-ui';
    background_color: string;
    theme_color: string;
}

export const PwaManifestEditor: React.FC = () => {
    const [manifest, setManifest] = useState<ManifestData>({
        name: 'DevCore 100 Progressive Web App',
        short_name: 'DevCore100',
        start_url: '/',
        display: 'standalone',
        background_color: '#1e293b',
        theme_color: '#06b6d4',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setManifest({ ...manifest, [e.target.name]: e.target.value });
    };

    const generatedJson = useMemo(() => {
        const fullManifest = {
            ...manifest,
            icons: [
                {
                    "src": "icon-192.png",
                    "type": "image/png",
                    "sizes": "192x192"
                },
                {
                    "src": "icon-512.png",
                    "type": "image/png",
                    "sizes": "512x512"
                }
            ]
        }
        return JSON.stringify(fullManifest, null, 2);
    }, [manifest]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedJson);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CodeBracketSquareIcon />
                    <span className="ml-3">PWA Manifest Editor</span>
                </h1>
                <p className="text-slate-400 mt-1">Configure and generate the `manifest.json` file for your PWA.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg overflow-y-auto">
                    <h3 className="text-xl font-bold">Configuration</h3>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-400">App Name</label>
                        <input type="text" name="name" value={manifest.name} onChange={handleChange} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                    </div>
                    <div>
                        <label htmlFor="short_name" className="block text-sm font-medium text-slate-400">Short Name</label>
                        <input type="text" name="short_name" value={manifest.short_name} onChange={handleChange} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                    </div>
                     <div>
                        <label htmlFor="start_url" className="block text-sm font-medium text-slate-400">Start URL</label>
                        <input type="text" name="start_url" value={manifest.start_url} onChange={handleChange} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                    </div>
                     <div>
                        <label htmlFor="display" className="block text-sm font-medium text-slate-400">Display Mode</label>
                        <select name="display" value={manifest.display} onChange={handleChange} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700">
                            <option>standalone</option>
                            <option>fullscreen</option>
                            <option>minimal-ui</option>
                        </select>
                    </div>
                     <div className="flex gap-4">
                        <div className="w-1/2">
                            <label htmlFor="background_color" className="block text-sm font-medium text-slate-400">Background Color</label>
                            <input type="color" name="background_color" value={manifest.background_color} onChange={handleChange} className="w-full mt-1 h-10 rounded-md bg-slate-800 border border-slate-700"/>
                        </div>
                        <div className="w-1/2">
                            <label htmlFor="theme_color" className="block text-sm font-medium text-slate-400">Theme Color</label>
                            <input type="color" name="theme_color" value={manifest.theme_color} onChange={handleChange} className="w-full mt-1 h-10 rounded-md bg-slate-800 border border-slate-700"/>
                        </div>
                     </div>
                </div>
                <div className="flex flex-col">
                     <label className="text-sm font-medium text-slate-400 mb-2">Generated manifest.json</label>
                     <div className="relative flex-grow">
                        <pre className="w-full h-full bg-slate-900 p-4 rounded-md text-cyan-300 text-sm overflow-auto">{generatedJson}</pre>
                        <button onClick={handleCopy} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs">Copy</button>
                    </div>
                </div>
            </div>
        </div>
    );
};