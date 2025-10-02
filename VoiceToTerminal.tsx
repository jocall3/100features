// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect } from 'react';
import { TerminalIcon } from '../icons/FeatureIcons.tsx';

const mockCommands = ["ls -la", "git status", "npm install", "echo 'Hello World'"];

export const VoiceToTerminal: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [command, setCommand] = useState('');

    useEffect(() => {
        if (isListening) {
            setCommand('');
            const randomCommand = mockCommands[Math.floor(Math.random() * mockCommands.length)];
            let i = 0;
            const intervalId = window.setInterval(() => {
                setCommand(prev => {
                    if (i < randomCommand.length) {
                        i++;
                        return randomCommand.substring(0, i);
                    }
                    window.clearInterval(intervalId);
                    setIsListening(false);
                    return randomCommand;
                });
            }, 100);
            return () => window.clearInterval(intervalId);
        }
    }, [isListening]);

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <TerminalIcon />
                    <span className="ml-3">Voice-to-Terminal (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of speaking shell commands hands-free.</p>
            </header>
            <div className="flex flex-col items-center gap-6">
                <button
                    onClick={() => setIsListening(true)}
                    disabled={isListening}
                    className={`w-32 h-32 rounded-full flex items-center justify-center text-white transition-colors ${isListening ? 'bg-red-500' : 'bg-cyan-500'}`}
                >
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z"></path><path d="M5.5 10.5a.5.5 0 011 0v1a3.5 3.5 0 007 0v-1a.5.5 0 011 0v1a4.5 4.5 0 01-4.5 4.5V18a.5.5 0 01-1 0v-1.5A4.5 4.5 0 015.5 11.5v-1z"></path></svg>
                </button>
                <div className="h-12 w-full max-w-md bg-slate-900 rounded-lg p-3 flex items-center font-mono text-cyan-300">
                    <span>$&nbsp;</span>
                    <span>{command}</span>
                    {isListening && <span className="animate-pulse">|</span>}
                </div>
                <p className="text-slate-500 text-sm">
                    {isListening ? 'Listening...' : 'Click the microphone to speak a command'}
                </p>
            </div>
        </div>
    );
};