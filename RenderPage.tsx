// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';
import { EyeIcon } from '../icons/FeatureIcons.tsx';

const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background-color: #f0f0f0; color: #333; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .container { text-align: center; padding: 2rem; background-color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #06b6d4; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, World!</h1>
        <p>This is a live preview.</p>
    </div>
</body>
</html>
`;

export const RenderPage: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <EyeIcon />
                    <span className="ml-3">Render Page (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A live preview for HTML, CSS, and JS content.</p>
            </header>
            <div className="flex-grow bg-white rounded-lg overflow-hidden border-4 border-slate-700">
                <iframe
                    srcDoc={sampleHtml}
                    title="Live Preview"
                    className="w-full h-full border-0"
                />
            </div>
        </div>
    );
};