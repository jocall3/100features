// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useRef, useCallback } from 'react';
import { transcribeAudioToCode } from '../../services/geminiService.ts';
import { CpuChipIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';
import { marked } from 'marked';

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            // remove the prefix "data:*/*;base64,"
            resolve(base64data.substring(base64data.indexOf(',') + 1));
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const AudioToCode: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleStartRecording = async () => {
        setError('');
        setCode('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = event => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = handleTranscribe;
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            setError('Microphone access was denied. Please enable it in your browser settings.');
        }
    };

    const handleStopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        setIsLoading(true);
    };

    const handleTranscribe = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        try {
            const base64Audio = await blobToBase64(audioBlob);
            const result = await transcribeAudioToCode(base64Audio, 'audio/webm');
            setCode(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to transcribe audio: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CpuChipIcon />
                    <span className="ml-3">AI Audio-to-Code</span>
                </h1>
                <p className="text-slate-400 mt-1">Speak your programming ideas and watch them turn into code.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col items-center justify-center bg-slate-800/50 p-6 rounded-lg">
                     <button
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        className={`w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'}`}
                        disabled={isLoading}
                    >
                        {isRecording ? 'Stop' : 'Record'}
                    </button>
                    <p className="mt-4 text-slate-400">
                        {isRecording ? 'Recording in progress...' : 'Click to start recording'}
                    </p>
                    {error && <p className="text-red-400 mt-4">{error}</p>}
                </div>
                 <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Generated Code</label>
                    <div className="flex-grow p-1 bg-slate-900 border border-slate-700 rounded-md overflow-y-auto">
                        {isLoading && (
                            <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>
                        )}
                        {code && !isLoading && (
                             <div
                                className="prose prose-sm prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-4 prose-pre:m-0 prose-code:text-cyan-300"
                                dangerouslySetInnerHTML={{ __html: marked(code) }}
                            />
                        )}
                        {!isLoading && !code && !error && (
                            <div className="text-slate-500 h-full flex items-center justify-center">Code will appear here.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};