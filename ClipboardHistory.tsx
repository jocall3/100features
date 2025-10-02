// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useEffect, useCallback } from 'react';
import { FileCodeIcon } from '../icons/FeatureIcons.tsx';

interface ClipboardItem {
    id: number;
    text: string;
}

export const ClipboardHistory: React.FC = () => {
    const [history, setHistory] = useState<ClipboardItem[]>([]);
    const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
    const [error, setError] = useState('');

    const checkPermission = useCallback(async () => {
        if (!navigator.permissions) {
             setError('Clipboard API not supported in this browser.');
             setPermissionStatus('denied');
             return;
        }
        try {
            const permission = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
            setPermissionStatus(permission.state);
            permission.onchange = () => setPermissionStatus(permission.state);
        } catch (e) {
             setError('Clipboard API not supported or permission could not be queried.');
             setPermissionStatus('denied');
        }
    }, []);

    useEffect(() => {
        checkPermission();
    }, [checkPermission]);

    useEffect(() => {
        const handleFocus = async () => {
            if (permissionStatus === 'granted') {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text && (history.length === 0 || history[0].text !== text)) {
                         setHistory(prev => [{ id: Date.now(), text }, ...prev.slice(0, 49)]);
                    }
                } catch(err) {
                    console.error("Could not read from clipboard on focus", err);
                }
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [permissionStatus, history]);

    const handleCopyItem = (text: string) => {
        navigator.clipboard.writeText(text);
    };
    
    const requestPermission = async () => {
        try {
            await navigator.clipboard.readText(); // This will trigger the prompt
            checkPermission();
        } catch (err) {
            setError('Permission was not granted.');
            setPermissionStatus('denied');
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <FileCodeIcon />
                    <span className="ml-3">Clipboard History</span>
                </h1>
                <p className="text-slate-400 mt-1">View and reuse items you've recently copied to your clipboard. (Updates on window focus)</p>
            </header>
            
            {permissionStatus !== 'granted' ? (
                <div className="flex-grow flex flex-col items-center justify-center bg-slate-800/50 rounded-lg p-8">
                    <p className="text-lg text-slate-300 mb-4">{error || "This feature requires permission to read from your clipboard."}</p>
                    {permissionStatus === 'prompt' && (
                        <button
                            onClick={requestPermission}
                            className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400"
                        >
                            Grant Permission
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                    {history.length > 0 ? (
                        history.map(item => (
                            <div key={item.id} className="bg-slate-800 p-3 rounded-md flex items-center justify-between gap-4">
                                <pre className="text-sm text-slate-300 truncate">{item.text}</pre>
                                <button
                                    onClick={() => handleCopyItem(item.text)}
                                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded-md flex-shrink-0"
                                >
                                    Copy
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-slate-500 h-full flex items-center justify-center">
                            Copy some text to start building your history...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};