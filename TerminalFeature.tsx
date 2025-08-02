import React from 'react';
import { TerminalIcon } from '../icons/FeatureIcons.tsx';
import TerminalComponent from '../Terminal.tsx';

export const TerminalFeature: React.FC = () => {
    return (
        <div className="h-full flex flex-col">
            {/* The header is removed for a more immersive terminal experience */}
            <div className="flex-grow bg-slate-900">
                <TerminalComponent initialMessage="Welcome to DevCore Terminal." />
            </div>
        </div>
    );
};