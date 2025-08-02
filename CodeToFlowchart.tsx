
import React, { useState, useCallback, useEffect } from 'react';
import { generateFlowchart } from '../../services/geminiService';
import { MapIcon } from '../icons/FeatureIcons';
import { LoadingSpinner } from './shared/LoadingSpinner';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    darkMode: true,
    securityLevel: 'loose',
    themeVariables: {
        background: '#1e293b', // slate-800
        primaryColor: '#334155', // slate-700
        primaryTextColor: '#cbd5e1', // slate-300
        lineColor: '#64748b', // slate-500
        textColor: '#cbd5e1',
    },
});

const exampleCode = `function checkNumber(num) {
  if (num > 0) {
    return "Positive";
  } else if (num < 0) {
    return "Negative";
  } else {
    return "Zero";
  }
}`;

export const CodeToFlowchart: React.FC = () => {
    const [code, setCode] = useState<string>(exampleCode);
    const [mermaidCode, setMermaidCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const chartRef = React.useRef<HTMLDivElement>(null);

    const handleGenerate = useCallback(async () => {
        if (!code.trim()) {
            setError('Please enter some code.');
            return;
        }
        setIsLoading(true);
        setError('');
        setMermaidCode('');
        if(chartRef.current) chartRef.current.innerHTML = '';

        try {
            const result = await generateFlowchart(code);
            setMermaidCode(result.mermaidCode);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate flowchart: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [code]);
    
    useEffect(() => {
        if (mermaidCode && chartRef.current) {
            try {
                mermaid.render('mermaid-chart', mermaidCode).then(({ svg }) => {
                    if (chartRef.current) {
                        chartRef.current.innerHTML = svg;
                    }
                });
            } catch (e) {
                if (e instanceof Error) setError(`Mermaid render error: ${e.message}`);
                console.error(e);
            }
        }
    }, [mermaidCode]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <MapIcon />
                    <span className="ml-3">Code to Flowchart</span>
                </h1>
                <p className="text-slate-400 mt-1">Turn your code's logic into a visual flowchart with AI.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full">
                    <label htmlFor="code-input" className="text-sm font-medium text-slate-400 mb-2">Source Code</label>
                    <textarea
                        id="code-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Flowchart'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Generated Flowchart</label>
                    <div className="flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto flex items-center justify-center">
                        {isLoading && <LoadingSpinner />}
                        {error && <p className="text-red-400">{error}</p>}
                        <div ref={chartRef} className="w-full h-full" />
                         {!isLoading && !mermaidCode && !error && <div className="text-slate-500">Flowchart will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
