
import React, { useState } from 'react';
import { FileCodeIcon } from '../icons/FeatureIcons.tsx';

interface JsonNodeProps {
    data: any;
    nodeKey: string;
    isRoot?: boolean;
}

const JsonNode: React.FC<JsonNodeProps> = ({ data, nodeKey, isRoot = false }) => {
    const [isOpen, setIsOpen] = useState(isRoot);
    const isObject = typeof data === 'object' && data !== null;

    const toggleOpen = () => setIsOpen(!isOpen);

    if (!isObject) {
        return (
            <div className="ml-4 pl-4 border-l border-slate-700">
                <span className="text-purple-400">{nodeKey}: </span>
                <span className={typeof data === 'string' ? 'text-green-400' : 'text-orange-400'}>
                    {typeof data === 'string' ? `"${data}"` : String(data)}
                </span>
            </div>
        );
    }

    const entries = Object.entries(data);
    const bracket = Array.isArray(data) ? '[]' : '{}';

    return (
        <div className={`ml-4 ${!isRoot ? 'pl-4 border-l border-slate-700' : ''}`}>
            <button onClick={toggleOpen} className="flex items-center cursor-pointer">
                <span className={`transform transition-transform ${isOpen ? 'rotate-90' : 'rotate-0'}`}>▶</span>
                <span className="ml-1 text-purple-400">{nodeKey}:</span>
                <span className="ml-2 text-slate-500">{bracket[0]}</span>
                {!isOpen && <span className="text-slate-500">...{bracket[1]}</span>}
            </button>
            {isOpen && (
                <div>
                    {entries.map(([key, value]) => (
                        <JsonNode key={key} nodeKey={key} data={value} />
                    ))}
                    <div className="text-slate-500 ml-4">{bracket[1]}</div>
                </div>
            )}
        </div>
    );
};

interface JsonTreeNavigatorProps {
    data?: any;
}

export const JsonTreeNavigator: React.FC<JsonTreeNavigatorProps> = ({ data }) => {
    const [jsonInput, setJsonInput] = useState('{\n  "id": "devcore-001",\n  "active": true,\n  "features": [\n    "ai-explainer",\n    "api-tester"\n  ],\n  "config": {\n    "theme": "dark",\n    "version": 1\n  }\n}');
    const [parsedData, setParsedData] = useState<any>(null);
    const [error, setError] = useState('');

    const parseJson = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            setParsedData(parsed);
            setError('');
        } catch (e) {
            if (e instanceof Error) setError(e.message);
            setParsedData(null);
        }
    };
    
    // If data is passed as a prop, use it directly
    if (data) {
        return (
            <div className="font-mono text-sm">
                <JsonNode data={data} nodeKey="root" isRoot />
            </div>
        );
    }
    
    // Standalone mode with textarea
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <FileCodeIcon />
                    <span className="ml-3">JSON Tree Navigator</span>
                </h1>
                <p className="text-slate-400 mt-1">Paste your JSON data to visualize it as a collapsible tree.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full">
                    <label htmlFor="json-input" className="text-sm font-medium text-slate-400 mb-2">JSON Input</label>
                    <textarea
                        id="json-input"
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className={`flex-grow p-4 bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-md resize-none font-mono text-sm text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                    />
                    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                    <button onClick={parseJson} className="mt-4 w-full px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400">
                        Render Tree
                    </button>
                </div>
                 <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Tree View</label>
                    <div className="flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto">
                        {parsedData ? <JsonTreeNavigator data={parsedData} /> : <div className="text-slate-500">Click "Render Tree" to view</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};