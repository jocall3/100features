// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useMemo } from 'react';
import { CodeBracketIcon } from '../icons/FeatureIcons.tsx';

export const CustomHookBuilder: React.FC = () => {
    const [hookName, setHookName] = useState('useCounter');

    const generatedCode = useMemo(() => {
        const capitalizedName = hookName.charAt(0).toUpperCase() + hookName.slice(1);
        return `import { useState, useEffect } from 'react';

export const ${hookName} = (initialValue) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        // Your logic here...
        console.log('Current value:', value);
    }, [value]);

    const increment = () => setValue(v => v + 1);
    const decrement = () => setValue(v => v - 1);
    const reset = () => setValue(initialValue);

    return { value, increment, decrement, reset };
};
`;
    }, [hookName]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CodeBracketIcon />
                    <span className="ml-3">Custom Hook Builder</span>
                </h1>
                <p className="text-slate-400 mt-1">Generate boilerplate for a custom React hook.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg justify-center">
                    <h3 className="text-xl font-bold">Configuration</h3>
                    <div>
                        <label htmlFor="hookName" className="block text-sm font-medium text-slate-400">Hook Name (e.g., useMyHook)</label>
                        <input
                            type="text"
                            id="hookName"
                            value={hookName}
                            onChange={e => setHookName(e.target.value)}
                            className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 font-mono"
                        />
                    </div>
                </div>
                <div className="flex flex-col">
                     <label className="text-sm font-medium text-slate-400 mb-2">Generated Code</label>
                     <div className="relative flex-grow">
                        <pre className="w-full h-full bg-slate-900 p-4 rounded-md text-cyan-300 text-sm overflow-auto font-mono">{generatedCode}</pre>
                        <button onClick={() => navigator.clipboard.writeText(generatedCode)} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs">Copy</button>
                    </div>
                </div>
            </div>
        </div>
    );
};