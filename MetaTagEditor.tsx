
import React, { useState, useMemo } from 'react';
import { CodeBracketSquareIcon } from '../icons/FeatureIcons.tsx';

interface MetaData {
    title: string;
    description: string;
    image: string;
    url: string;
}

export const MetaTagEditor: React.FC = () => {
    const [meta, setMeta] = useState<MetaData>({
        title: 'DevCore 100',
        description: 'The ultimate toolkit for modern developers.',
        image: 'https://example.com/social-card.png',
        url: 'https://devcore100.example.com'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMeta({ ...meta, [e.target.name]: e.target.value });
    };

    const generatedHtml = useMemo(() => {
        return `<!-- Primary Meta Tags -->
<title>${meta.title}</title>
<meta name="title" content="${meta.title}" />
<meta name="description" content="${meta.description}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${meta.url}" />
<meta property="og:title" content="${meta.title}" />
<meta property="og:description" content="${meta.description}" />
<meta property="og:image" content="${meta.image}" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="${meta.url}" />
<meta property="twitter:title" content="${meta.title}" />
<meta property="twitter:description" content="${meta.description}" />
<meta property="twitter:image" content="${meta.image}" />`;
    }, [meta]);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(generatedHtml);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CodeBracketSquareIcon />
                    <span className="ml-3">Meta Tag Editor</span>
                </h1>
                <p className="text-slate-400 mt-1">Generate SEO and social media meta tags for your website.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold">Metadata</h3>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-400">Title</label>
                        <input type="text" name="title" value={meta.title} onChange={handleChange} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-400">Description</label>
                        <input type="text" name="description" value={meta.description} onChange={handleChange} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                    </div>
                     <div>
                        <label htmlFor="url" className="block text-sm font-medium text-slate-400">Canonical URL</label>
                        <input type="text" name="url" value={meta.url} onChange={handleChange} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                    </div>
                     <div>
                        <label htmlFor="image" className="block text-sm font-medium text-slate-400">Social Image URL</label>
                        <input type="text" name="image" value={meta.image} onChange={handleChange} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                    </div>
                </div>
                <div className="flex flex-col">
                     <label className="text-sm font-medium text-slate-400 mb-2">Generated HTML</label>
                     <div className="relative flex-grow">
                        <pre className="w-full h-full bg-slate-900 p-4 rounded-md text-cyan-300 text-sm overflow-auto">{generatedHtml}</pre>
                        <button onClick={handleCopy} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs">Copy</button>
                    </div>
                </div>
            </div>
        </div>
    );
};