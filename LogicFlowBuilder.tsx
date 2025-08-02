import React from 'react';
import { MapIcon } from '../icons/FeatureIcons.tsx';

const Node: React.FC<{ title: string, x: number, y: number, color: string }> = ({ title, x, y, color }) => (
    <div
        className={`absolute border rounded-lg px-4 py-2 shadow-lg ${color}`}
        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
        {title}
    </div>
);

const Edge: React.FC<{ x1: number, y1: number, x2: number, y2: number }> = ({ x1, y1, x2, y2 }) => (
    <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke="#475569" strokeWidth="2" />
);

export const LogicFlowBuilder: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <MapIcon />
                    <span className="ml-3">Logic Flow Builder (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of a visual tool for building application logic.</p>
            </header>
            <div className="flex-grow relative bg-slate-900/50 p-8 rounded-lg border-2 border-dashed border-slate-700">
                <svg className="absolute inset-0 w-full h-full">
                    <Edge x1={20} y1={20} x2={50} y2={50} />
                    <Edge x1={50} y1={50} x2={80} y2={20} />
                    <Edge x1={50} y1={50} x2={80} y2={80} />
                </svg>
                <Node title="API Request" x={20} y={20} color="border-purple-500 bg-purple-500/10" />
                <Node title="Process Data" x={50} y={50} color="border-cyan-500 bg-cyan-500/10" />
                <Node title="Update UI" x={80} y={20} color="border-green-500 bg-green-500/10" />
                <Node title="Log Error" x={80} y={80} color="border-red-500 bg-red-500/10" />
            </div>
        </div>
    );
};