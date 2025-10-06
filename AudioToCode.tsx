// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudioToCode } from '../../services/geminiService.ts';
import { CpuChipIcon } from '../icons/FeatureIcons.tsx';
import { LoadingSpinner } from './shared/LoadingSpinner.tsx';
import { marked } from 'marked';
import { PlayIcon, StopIcon, ClipboardDocumentIcon, TrashIcon, SpeakerWaveIcon, SpeakerXMarkIcon, MicrophoneIcon } from '@heroicons/react/24/solid'; // Assuming Heroicons for new icons
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'; // For the check icon

/**
 * @typedef {Object} AudioInputDevice
 * @property {string} deviceId - The unique identifier of the audio input device.
 * @property {string} label - The user-friendly name of the device.
 */
export interface AudioInputDevice {
    deviceId: string;
    label: string;
}

/**
 * @typedef {Object} AudioToCodeProps
 * @property {string} [initialInstruction] - An optional initial instruction to display to the user.
 */
export interface AudioToCodeProps {
    initialInstruction?: string;
}

/**
 * Converts a Blob object to a Base64 string, stripping the data URI prefix.
 * @param {Blob} blob - The Blob object to convert.
 * @returns {Promise<string>} A promise that resolves with the Base64 string.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
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

/**
 * AudioToCode component provides an interface for users to record audio
 * and transcribe it into code using an AI service.
 * It includes features like device selection, audio playback,
 * code copying, and robust error handling.
 *
 * @param {AudioToCodeProps} props - The component's props.
 */
export const AudioToCode: React.FC<AudioToCodeProps> = ({ initialInstruction }) => {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
    const [isPlayingRecordedAudio, setIsPlayingRecordedAudio] = useState<boolean>(false);
    const [audioInputDevices, setAudioInputDevices] = useState<AudioInputDevice[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    /**
     * Effect hook to enumerate available audio input devices on component mount.
     */
    useEffect(() => {
        const getAudioInputDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs: AudioInputDevice[] = devices
                    .filter(device => device.kind === 'audioinput')
                    .map(device => ({
                        deviceId: device.deviceId,
                        label: device.label || `Microphone ${device.deviceId}`
                    }));
                setAudioInputDevices(audioInputs);
                if (audioInputs.length > 0 && selectedDeviceId === 'default') {
                    setSelectedDeviceId(audioInputs[0].deviceId);
                }
            } catch (err) {
                setError('Failed to enumerate audio devices. Please ensure microphone access is granted.');
            }
        };
        getAudioInputDevices();
    }, [selectedDeviceId]);

    /**
     * Handles the start of audio recording.
     * Requests microphone access and initializes MediaRecorder.
     */
    const handleStartRecording = useCallback(async () => {
        setError('');
        setCode('');
        setRecordedAudioBlob(null);
        setIsCopied(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: selectedDeviceId === 'default' ? undefined : { exact: selectedDeviceId }
                }
            });
            mediaRecorderRef.current = new new window.MediaRecorder(stream);
            audioChunksRef.current = []; // Clear previous chunks
            mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            mediaRecorderRef.current.onstop = handleTranscribe;
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Microphone access error:', err);
            setError('Microphone access was denied or device not found. Please enable it in your browser settings.');
            setIsRecording(false);
            setIsLoading(false);
        }
    }, [selectedDeviceId]);

    /**
     * Handles the stop of audio recording.
     * Triggers the transcription process.
     */
    const handleStopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsLoading(true);
        }
    }, []);

    /**
     * Handles the transcription of the recorded audio.
     * Converts the audio Blob to Base64 and sends it to the AI service.
     */
    const handleTranscribe = useCallback(async () => {
        if (audioChunksRef.current.length === 0) {
            setError('No audio was recorded. Please ensure your microphone is working.');
            setIsLoading(false);
            return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob); // Store the blob for potential playback
        audioChunksRef.current = []; // Clear chunks for next recording
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
    }, []);

    /**
     * Handles copying the generated code to the clipboard.
     */
    const handleCopyCode = useCallback(async () => {
        if (code) {
            try {
                await navigator.clipboard.writeText(code);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000); // Reset copied state after 2 seconds
            } catch (err) {
                console.error('Failed to copy code:', err);
                setError('Failed to copy code to clipboard.');
            }
        }
    }, [code]);

    /**
     * Clears the generated code, errors, and recorded audio.
     */
    const handleClearOutput = useCallback(() => {
        setCode('');
        setError('');
        setRecordedAudioBlob(null);
        setIsCopied(false);
        setIsPlayingRecordedAudio(false);
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.src = '';
        }
    }, []);

    /**
     * Plays the recorded audio blob.
     */
    const handlePlayRecordedAudio = useCallback(() => {
        if (recordedAudioBlob) {
            const audioUrl = URL.createObjectURL(recordedAudioBlob);
            if (audioPlayerRef.current) {
                audioPlayerRef.current.src = audioUrl;
                audioPlayerRef.current.play();
                setIsPlayingRecordedAudio(true);
                audioPlayerRef.current.onended = () => {
                    setIsPlayingRecordedAudio(false);
                    URL.revokeObjectURL(audioUrl); // Clean up the object URL
                };
            }
        }
    }, [recordedAudioBlob]);

    /**
     * Stops the playback of the recorded audio.
     */
    const handleStopRecordedAudio = useCallback(() => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.currentTime = 0;
            setIsPlayingRecordedAudio(false);
        }
    }, []);

    /**
     * Handles change in audio input device selection.
     * @param {React.ChangeEvent<HTMLSelectElement>} event - The change event from the select element.
     */
    const handleDeviceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDeviceId(event.target.value);
    }, []);

    // Memoized output display for performance
    const renderCodeOutput = useCallback(() => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>
            );
        }
        if (error) {
            return (
                <div className="text-red-400 p-4 text-center">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                </div>
            );
        }
        if (code) {
            return (
                <div
                    className="prose prose-sm prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-4 prose-pre:m-0 prose-code:text-cyan-300"
                    dangerouslySetInnerHTML={{ __html: marked(code) }}
                />
            );
        }
        return (
            <div className="text-slate-500 h-full flex items-center justify-center text-center">
                {initialInstruction || "Speak into your microphone to generate code."}
            </div>
        );
    }, [isLoading, error, code, initialInstruction]);


    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CpuChipIcon className="w-8 h-8" />
                    <span className="ml-3">AI Audio-to-Code</span>
                </h1>
                <p className="text-slate-400 mt-1">Speak your programming ideas and watch them turn into code.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* Input Control Section */}
                <div className="flex flex-col items-center justify-center bg-slate-800/50 p-6 rounded-lg shadow-lg">
                    <div className="relative mb-6">
                        <button
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            className={`w-36 h-36 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all transform duration-300 ease-in-out
                                ${isRecording ? 'bg-red-600 animate-pulse-fast ring-8 ring-red-500/30' : 'bg-cyan-600 hover:bg-cyan-700 ring-4 ring-cyan-500/30'}
                                ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={isLoading}
                            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                        >
                            {isRecording ? <StopIcon className="w-16 h-16" /> : <MicrophoneIcon className="w-16 h-16" />}
                        </button>
                        {isRecording && (
                            <span className="absolute top-0 right-0 -mr-2 -mt-2 w-5 h-5 bg-red-500 rounded-full animate-ping-slow"></span>
                        )}
                    </div>
                    <p className="mt-4 text-slate-300 font-medium text-lg">
                        {isRecording ? 'Recording in progress...' : 'Click the button to start recording'}
                    </p>
                    <p className="text-slate-500 text-sm mb-4">
                        {isRecording ? 'Click again to stop and transcribe.' : 'Your voice will be converted to code.'}
                    </p>

                    {/* Audio Input Device Selector */}
                    {audioInputDevices.length > 1 && (
                        <div className="w-full max-w-xs mt-4">
                            <label htmlFor="audio-device-select" className="block text-sm font-medium text-slate-400 mb-2">
                                Select Microphone:
                            </label>
                            <select
                                id="audio-device-select"
                                value={selectedDeviceId}
                                onChange={handleDeviceChange}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md bg-slate-700 text-slate-100"
                                disabled={isRecording || isLoading}
                                aria-label="Select audio input device"
                            >
                                {audioInputDevices.map(device => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Output Display Section */}
                <div className="flex flex-col h-full bg-slate-800/50 p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-lg font-bold text-slate-300">Generated Code</label>
                        <div className="flex space-x-2">
                            {recordedAudioBlob && (
                                <button
                                    onClick={isPlayingRecordedAudio ? handleStopRecordedAudio : handlePlayRecordedAudio}
                                    className="p-2 rounded-full bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
                                    title={isPlayingRecordedAudio ? 'Stop Playback' : 'Play Recorded Audio'}
                                    aria-label={isPlayingRecordedAudio ? 'Stop playing recorded audio' : 'Play recorded audio'}
                                >
                                    {isPlayingRecordedAudio ? <SpeakerXMarkIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
                                </button>
                            )}
                            {code && (
                                <>
                                    <button
                                        onClick={handleCopyCode}
                                        className="p-2 rounded-full bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
                                        title="Copy Code"
                                        aria-label="Copy generated code to clipboard"
                                    >
                                        {isCopied ? <ClipboardDocumentCheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={handleClearOutput}
                                        className="p-2 rounded-full bg-red-700 text-white hover:bg-red-600 transition-colors"
                                        title="Clear Output"
                                        aria-label="Clear generated code and error"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex-grow p-1 bg-slate-900 border border-slate-700 rounded-md overflow-y-auto text-sm font-mono relative">
                        {renderCodeOutput()}
                    </div>
                    <audio ref={audioPlayerRef} className="hidden" />
                </div>
            </div>
            {/* Global Error Display (if desired, currently handled within output section) */}
            {/* {error && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-800 text-white p-3 rounded-md shadow-lg">{error}</div>} */}
        </div>
    );
};