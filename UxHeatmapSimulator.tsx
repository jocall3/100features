import React from 'react';
import { ChartBarIcon } from '../icons/FeatureIcons.tsx';

export const UxHeatmapSimulator: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center justify-center">
                    <ChartBarIcon />
                    <span className="ml-3">UX Heatmap Simulator</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation visualizing user interaction hotspots.</p>
            </header>
            <div className="flex-grow flex items-center justify-center">
                <div 
                    className="relative w-full max-w-4xl aspect-video bg-cover bg-center rounded-lg shadow-lg border border-slate-700"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542435503-956c469947f6?q=80&w=1974&auto=format&fit=crop')" }}
                >
                    <div 
                        className="absolute inset-0 w-full h-full"
                        style={{ background: 'radial-gradient(circle at 20% 30%, rgba(255, 0, 0, 0.6) 0%, rgba(255, 0, 0, 0) 20%), radial-gradient(circle at 80% 70%, rgba(255, 100, 0, 0.7) 0%, rgba(255, 100, 0, 0) 25%), radial-gradient(circle at 50% 50%, rgba(255, 200, 0, 0.5) 0%, rgba(255, 200, 0, 0) 15%)' }}
                    >
                    </div>
                </div>
            </div>
        </div>
    );
};