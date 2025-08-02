import React from 'react';
import { SparklesIcon } from '../icons/FeatureIcons.tsx';

const sounds = [
    { name: 'Click', url: 'https://cdn.jsdelivr.net/gh/kristopolous/musicworker-front@master/htdocs/resources/sfx/click.mp3' },
    { name: 'Success', url: 'https://cdn.jsdelivr.net/gh/kristopolous/musicworker-front@master/htdocs/resources/sfx/success.mp3' },
    { name: 'Error', url: 'https://cdn.jsdelivr.net/gh/kristopolous/musicworker-front@master/htdocs/resources/sfx/error.mp3' },
    { name: 'Notification', url: 'https://cdn.jsdelivr.net/gh/kristopolous/musicworker-front@master/htdocs/resources/sfx/notification.mp3' },
    { name: 'Deploy', url: 'https://cdn.jsdelivr.net/gh/kristopolous/musicworker-front@master/htdocs/resources/sfx/deploy.mp3' },
    { name: 'Typing', url: 'https://cdn.jsdelivr.net/gh/kristopolous/musicworker-front@master/htdocs/resources/sfx/typing.mp3' },
];

export const DevSoundboard: React.FC = () => {
    
    const playSound = (url: string) => {
        new Audio(url).play();
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center justify-center">
                    <SparklesIcon />
                    <span className="ml-3">Dev Soundboard</span>
                </h1>
                <p className="text-slate-400 mt-1">For when you need that satisfying sound effect.</p>
            </header>
            <div className="flex-grow grid grid-cols-2 md:grid-cols-3 gap-4">
                {sounds.map(sound => (
                    <button
                        key={sound.name}
                        onClick={() => playSound(sound.url)}
                        className="p-8 bg-slate-800/50 rounded-lg text-slate-200 font-bold text-xl hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors"
                    >
                        {sound.name}
                    </button>
                ))}
            </div>
        </div>
    );
};