import React, { useState } from 'react';
import { SparklesIcon } from '../icons/FeatureIcons.tsx';

const useLocalStorage = (key: string, initialValue: any) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) { return initialValue; }
    });
    const setValue = (value: any) => {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
    };
    return [storedValue, setValue];
};

const moods = [
    { emoji: '😄', label: 'Great' },
    { emoji: '😊', label: 'Good' },
    { emoji: '😐', label: 'Okay' },
    { emoji: '😟', label: 'Struggling' },
    { emoji: '🔥', label: 'In the Zone' },
];

export const DevMoodTracker: React.FC = () => {
    const [selectedMood, setSelectedMood] = useLocalStorage('devcore_mood', null);

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <SparklesIcon />
                    <span className="ml-3">Dev Mood Tracker</span>
                </h1>
                <p className="text-slate-400 mt-1">How are you feeling today?</p>
            </header>
            <div className="flex items-center justify-center gap-4 md:gap-8">
                {moods.map(mood => (
                    <button
                        key={mood.label}
                        onClick={() => setSelectedMood(mood.label)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all transform hover:scale-110 ${selectedMood === mood.label ? 'bg-cyan-500/20' : 'bg-slate-800/50'}`}
                    >
                        <span className="text-5xl">{mood.emoji}</span>
                        <span className="font-semibold text-slate-300">{mood.label}</span>
                    </button>
                ))}
            </div>
            {selectedMood && (
                <p className="mt-8 text-lg text-green-400">Thanks for checking in! You're feeling: {selectedMood}</p>
            )}
        </div>
    );
};