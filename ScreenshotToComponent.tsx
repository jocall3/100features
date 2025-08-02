import React, { useState, useCallback } from 'react';
import { generateComponentFromImage } from '../../services/geminiService';
import { PhotoIcon } from '../icons/FeatureIcons';
import { LoadingSpinner } from './shared/LoadingSpinner';
import { marked } from 'marked';

export const ScreenshotToComponent: React.FC = () => {
    const [pastedImage, setPastedImage] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePaste = useCallback(async (event: React.ClipboardEvent) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const base64Image = (e.target?.result as string).split(',')[1];
                        setPastedImage(e.target?.result as string);
                        handleGenerate(base64Image);
                    };
                    reader.readAsDataURL(blob);
                }
                return;
            }
        }
    }, []);

    const handleGenerate = async (base64Image: string) => {
        setIsLoading(true);
        setError('');
        setCode('');
        try {
            const result = await generateComponentFromImage(base64Image);
            setCode(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate component: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <PhotoIcon />
                    <span className="ml-3">AI Screenshot-to-Component</span>
                </h1>
                <p className="text-slate-400 mt-1">Take a screenshot of a UI element and paste it here to generate code.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div 
                    onPaste={handlePaste}
                    className="flex flex-col items-center justify-center bg-slate-800/50 p-6 rounded-lg border-2 border-dashed border-slate-700 focus:outline-none focus:border-cyan-500"
                    tabIndex={0}
                >
                    {pastedImage ? (
                        <img src={pastedImage} alt="Pasted content" className="max-w-full max-h-full object-contain rounded-md shadow-lg" />
                    ) : (
                        <div className="text-center text-slate-400">
                            <h2 className="text-xl font-bold">Paste an image here</h2>
                            <p>(Cmd/Ctrl + V)</p>
                        </div>
                    )}
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Generated Code</label>
                    <div className="flex-grow p-1 bg-slate-900 border border-slate-700 rounded-md overflow-y-auto">
                        {isLoading && (
                            <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>
                        )}
                        {error && <p className="p-4 text-red-400">{error}</p>}
                        {code && !isLoading && (
                            <div
                                className="prose prose-sm prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-4 prose-pre:m-0 prose-code:text-cyan-300"
                                dangerouslySetInnerHTML={{ __html: marked(code) }}
                            />
                        )}
                        {!isLoading && !code && !error && (
                            <div className="text-slate-500 h-full flex items-center justify-center">Generated component code will appear here.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};