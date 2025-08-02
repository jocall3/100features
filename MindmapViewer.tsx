import React from 'react';
import { MapIcon } from '../icons/FeatureIcons.tsx';

const Node: React.FC<{ title: string, x: number, y: number, r: number, color?: string }> = ({ title, x, y, r, color = "bg-slate-700" }) => (
    <div
        className={`absolute rounded-full flex items-center justify-center text-xs text-center p-1 ${color}`}
        style={{ left: `${x}%`, top: `${y}%`, width: `${r * 2}px`, height: `${r*2}px`, transform: 'translate(-50%, -50%)' }}
    >
        {title}
    </div>
);

const Edge: React.FC<{ x1: number, y1: number, x2: number, y2: number }> = ({ x1, y1, x2, y2 }) => (
    <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke="#475569" strokeWidth="1" />
);

export const MindmapViewer: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <MapIcon />
                    <span className="ml-3">Mindmap Viewer (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A visual representation of the project structure.</p>
            </header>
            <div className="flex-grow relative bg-slate-900/50 p-8 rounded-lg border-2 border-dashed border-slate-700">
                <svg className="absolute inset-0 w-full h-full">
                    <Edge x1={50} y1={50} x2={25} y2={25} />
                    <Edge x1={50} y1={50} x2={75} y2={25} />
                    <Edge x1={50} y1={50} x2={25} y2={75} />
                    <Edge x1={50} y1={50} x2={75} y2={75} />
                    <Edge x1={25} y1={25} x2={15} y2={10} />
                    <Edge x1={25} y1={25} x2={35} y2={10} />
                </svg>
                <Node title="App.tsx" x={50} y={50} r={40} color="bg-cyan-500/20" />
                <Node title="components" x={25} y={25} r={35} color="bg-purple-500/20" />
                <Node title="services" x={75} y={25} r={30} />
                <Node title="features" x={25} y={75} r={35} />
                <Node title="types" x={75} y={75} r={30} />
                <Node title="Button.tsx" x={15} y={10} r={25} />
                <Node title="Input.tsx" x={35} y={10} r={25} />
            </div>
        </div>
    );
};