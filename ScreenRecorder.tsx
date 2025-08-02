import React, { useState, useEffect } from 'react';
import { PhotoIcon } from '../icons/FeatureIcons.tsx';

export const ScreenRecorder: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [timer, setTimer] = useState(0);
    const [permissionError, setPermissionError] = useState('');

    useEffect(() => {
        if (isRecording) {
            const intervalId = window.setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
            return () => window.clearInterval(intervalId);
        } else {
            setTimer(0);
        }
    }, [isRecording]);

    const startRecording = async () => {
        setPermissionError('');
        try {
            // Request permissions to simulate starting a recording
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setIsRecording(true);
        } catch (err) {
            setPermissionError('Camera/Mic permission denied. Please grant access to use this feature.');
            console.error("Permission error:", err);
        }
    };
    
    const stopRecording = () => {
        setIsRecording(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <PhotoIcon />
                    <span className="ml-3">Screen Recorder (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of a screen and camera recording tool.</p>
            </header>
            <div className="flex flex-col items-center gap-4">
                <div
                     className={`w-48 h-48 rounded-full border-8 flex flex-col items-center justify-center transition-colors ${isRecording ? 'border-red-500' : 'border-slate-700'}`}>
                    <div className={`w-16 h-16 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
                    {isRecording && <p className="font-mono text-2xl mt-2">{formatTime(timer)}</p>}
                </div>

                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className="px-8 py-3 bg-cyan-500 text-slate-900 font-bold rounded-lg text-lg"
                >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
                {permissionError && <p className="text-red-400 max-w-sm mt-4">{permissionError}</p>}
            </div>
        </div>
    );
};