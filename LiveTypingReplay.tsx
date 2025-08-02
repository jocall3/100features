import React, { useState, useEffect } from 'react';
import { EyeIcon } from '../icons/FeatureIcons.tsx';

const fullCode = `import React from 'react';

function MyComponent() {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
`;

export const LiveTypingReplay: React.FC = () => {
    const [typedCode, setTypedCode] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (isRunning) {
            setTypedCode('');
            let i = 0;
            const intervalId = window.setInterval(() => {
                setTypedCode(prev => {
                    if (i < fullCode.length) {
                        i++;
                        return fullCode.substring(0, i);
                    }
                    window.clearInterval(intervalId);
                    setIsRunning(false);
                    return fullCode;
                });
            }, 30);
            return () => window.clearInterval(intervalId);
        }
    }, [isRunning]);
    
    const startReplay = () => {
        setIsRunning(true);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <EyeIcon />
                        <span className="ml-3">Live Typing Replay (Simulation)</span>
                    </h1>
                    <p className="text-slate-400 mt-1">Watch a past coding session unfold.</p>
                </div>
                <button
                    onClick={startReplay}
                    disabled={isRunning}
                    className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md disabled:bg-slate-600"
                >
                    {isRunning ? 'Replaying...' : 'Start Replay'}
                </button>
            </header>
            <div className="relative flex-grow font-mono text-sm bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-auto">
                <pre className="text-cyan-300 whitespace-pre-wrap">
                    {typedCode}<span className="animate-pulse">|</span>
                </pre>
            </div>
        </div>
    );
};