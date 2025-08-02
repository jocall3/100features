
import React, { useState, useEffect } from 'react';
import { SparklesIcon } from '../icons/FeatureIcons.tsx';

export const CodeAudioNarrator: React.FC = () => {
    const [text, setText] = useState('function helloWorld() {\n  console.log("Hello, world!");\n}');
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string | undefined>();
    const [rate, setRate] = useState(1);
    const [pitch, setPitch] = useState(1);

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
            if(availableVoices.length > 0) {
                setSelectedVoice(availableVoices.find(v => v.lang.startsWith('en'))?.name || availableVoices[0].name);
            }
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const speak = () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) {
            utterance.voice = voice;
        }
        utterance.rate = rate;
        utterance.pitch = pitch;
        window.speechSynthesis.speak(utterance);
    };
    
    const stop = () => {
        window.speechSynthesis.cancel();
    }

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <SparklesIcon />
                    <span className="ml-3">Code Audio Narrator</span>
                </h1>
                <p className="text-slate-400 mt-1">Have your code read aloud for accessibility or proof-listening.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-2 flex flex-col h-full">
                     <label htmlFor="code-narrator-input" className="text-sm font-medium text-slate-400 mb-2">Code to Read</label>
                     <textarea
                        id="code-narrator-input"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                </div>
                 <div className="flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold">Controls</h3>
                    <div>
                        <label htmlFor="voice-select" className="block text-sm font-medium text-slate-400">Voice</label>
                        <select
                            id="voice-select"
                            value={selectedVoice}
                            onChange={e => setSelectedVoice(e.target.value)}
                            className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"
                        >
                            {voices.map(voice => (
                                <option key={voice.name} value={voice.name}>{voice.name} ({voice.lang})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="rate" className="block text-sm font-medium text-slate-400">Rate ({rate.toFixed(1)})</label>
                        <input id="rate" type="range" min="0.5" max="2" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div>
                        <label htmlFor="pitch" className="block text-sm font-medium text-slate-400">Pitch ({pitch.toFixed(1)})</label>
                        <input id="pitch" type="range" min="0" max="2" step="0.1" value={pitch} onChange={e => setPitch(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                     <div className="flex gap-2 mt-auto">
                        <button onClick={speak} className="flex-1 px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md">Speak</button>
                        <button onClick={stop} className="flex-1 px-6 py-3 bg-slate-700 text-slate-200 font-bold rounded-md">Stop</button>
                    </div>
                </div>
            </div>
        </div>
    );
};