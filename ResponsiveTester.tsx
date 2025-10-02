// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState } from 'react';
import { EyeIcon } from '../icons/FeatureIcons.tsx';

const devices = {
    'iPhone 12': { width: 390, height: 844 },
    'iPad Air': { width: 820, height: 1180 },
    'Laptop': { width: 1366, height: 768 },
    'Desktop': { width: 1920, height: 1080 },
    'Auto': { width: '100%', height: '100%' },
};

type DeviceName = keyof typeof devices;

export const ResponsiveTester: React.FC = () => {
    const [url, setUrl] = useState('https://react.dev');
    const [displayUrl, setDisplayUrl] = useState(url);
    const [activeDevice, setActiveDevice] = useState<DeviceName>('Auto');

    const iframeSize = devices[activeDevice];
    
    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // A simple check to prepend https:// if missing
        setDisplayUrl(url.startsWith('http') ? url : `https://${url}`);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <EyeIcon />
                    <span className="ml-3">Responsive Tester</span>
                </h1>
                <p className="text-slate-400 mt-1">Preview your web pages at different screen sizes.</p>
            </header>
            <form onSubmit={handleUrlSubmit} className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-grow px-4 py-2 rounded-md bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <button type="submit" className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400">Load</button>
            </form>
            <div className="bg-slate-800/50 p-2 rounded-lg flex justify-center items-center gap-2 mb-4">
                {Object.keys(devices).map(name => (
                    <button
                        key={name}
                        onClick={() => setActiveDevice(name as DeviceName)}
                        className={`px-3 py-1 rounded-md text-sm ${activeDevice === name ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-700'}`}
                    >
                        {name}
                    </button>
                ))}
            </div>
            <div className="flex-grow flex items-center justify-center bg-slate-900 rounded-lg p-4 overflow-auto">
                <iframe
                    key={displayUrl} // Force re-render on URL change
                    src={displayUrl}
                    style={{ width: iframeSize.width, height: iframeSize.height, maxWidth: '100%', maxHeight: '100%' }}
                    className="bg-white border-4 border-slate-700 rounded-md transition-all duration-300"
                    title="Responsive Preview"
                />
            </div>
        </div>
    );
};