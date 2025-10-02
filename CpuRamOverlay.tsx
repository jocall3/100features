// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect } from 'react';
import { ChartBarIcon } from '../icons/FeatureIcons.tsx';

const MAX_POINTS = 50;

export const CpuRamOverlay: React.FC = () => {
    const [cpuData, setCpuData] = useState<number[]>([]);
    const [ramData, setRamData] = useState<number[]>([]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setCpuData(prev => [...prev.slice(-MAX_POINTS + 1), Math.random() * 80 + 10]);
            setRamData(prev => [...prev.slice(-MAX_POINTS + 1), Math.random() * 60 + 20]);
        }, 500);
        return () => window.clearInterval(intervalId);
    }, []);

    const renderPath = (data: number[], color: string) => {
        if (data.length < 2) return '';
        const points = data.map((p, i) => `${(i / (MAX_POINTS - 1)) * 100},${100 - p}`).join(' L');
        return <path d={`M ${points}`} stroke={color} fill="none" strokeWidth="2" />;
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ChartBarIcon />
                    <span className="ml-3">CPU/RAM Usage Overlay (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A real-time simulation of system resource monitoring.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 gap-6">
                <div className="bg-slate-900 p-4 rounded-lg">
                    <h3 className="font-bold text-cyan-400">CPU Usage ({cpuData.slice(-1)[0]?.toFixed(0) || 0}%)</h3>
                    <svg viewBox="0 0 100 100" className="w-full h-32 mt-2" preserveAspectRatio="none">
                        {renderPath(cpuData, '#06b6d4')}
                    </svg>
                </div>
                 <div className="bg-slate-900 p-4 rounded-lg">
                    <h3 className="font-bold text-purple-400">RAM Usage ({ramData.slice(-1)[0]?.toFixed(0) || 0}%)</h3>
                    <svg viewBox="0 0 100 100" className="w-full h-32 mt-2" preserveAspectRatio="none">
                        {renderPath(ramData, '#a855f7')}
                    </svg>
                </div>
            </div>
        </div>
    );
};