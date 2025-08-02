import React, { useState } from 'react';
import { CodeBracketIcon } from '../icons/FeatureIcons.tsx';

export const ClipboardToCode: React.FC = () => {
    const [content, setContent] = useState('');

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        const pastedText = await navigator.clipboard.readText();
        const newContent = `${content}\`\`\`\n${pastedText}\n\`\`\``;
        setContent(newContent);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CodeBracketIcon />
                    <span className="ml-3">Clipboard-to-Code Mode</span>
                </h1>
                <p className="text-slate-400 mt-1">Paste any content into the text area below to automatically wrap it in a code block.</p>
            </header>
            <div className="flex-grow flex flex-col h-full">
                <label htmlFor="paste-area" className="text-sm font-medium text-slate-400 mb-2">Paste Zone</label>
                <textarea
                    id="paste-area"
                    value={content}
                    onPaste={handlePaste}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste here (Ctrl+V)..."
                    className="flex-grow p-4 bg-slate-900 border-2 border-dashed border-slate-700 rounded-md resize-none font-mono text-sm text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
            </div>
        </div>
    );
};