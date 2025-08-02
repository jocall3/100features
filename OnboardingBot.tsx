import React, { useState, useEffect } from 'react';
import { CpuChipIcon } from '../icons/FeatureIcons.tsx';

const script = [
    { from: 'bot', text: 'Welcome to DevCore 100! I\'m your onboarding assistant.' },
    { from: 'bot', text: 'Let\'s get started by exploring the Feature Palette on the right. Try dragging a feature into a slot.' },
    { from: 'user', text: 'Okay, I did that.' },
    { from: 'bot', text: 'Great! Now, let\'s open the AI Code Explainer. You can find it in the left sidebar.' },
    { from: 'user', text: 'Done.' },
    { from: 'bot', text: 'Awesome! You can paste any code there to get a detailed explanation. You\'re all set. Enjoy exploring!' }
];

export const OnboardingBot: React.FC = () => {
    const [messages, setMessages] = useState<typeof script>([]);
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (step < script.length) {
            const timer = setTimeout(() => {
                setMessages(prev => [...prev, script[step]]);
                setStep(s => s + 1);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [step]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CpuChipIcon />
                    <span className="ml-3">Onboarding Bot (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of a chat-based tutorial.</p>
            </header>
            <div className="flex-grow bg-slate-900/50 p-4 rounded-lg flex flex-col gap-4 overflow-y-auto">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex items-end gap-2 ${msg.from === 'bot' ? 'justify-start' : 'justify-end'}`}>
                        {msg.from === 'bot' && <div className="w-8 h-8 rounded-full bg-cyan-500 flex-shrink-0"></div>}
                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.from === 'bot' ? 'bg-slate-700 text-slate-200' : 'bg-purple-600 text-white'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};