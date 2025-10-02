// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';
import { ChartBarIcon } from '../icons/FeatureIcons.tsx';

const StatCard: React.FC<{ title: string, value: string, children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-slate-800/50 p-6 rounded-lg">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <p className="text-3xl font-bold text-slate-100 mt-1">{value}</p>
        {children}
    </div>
);

const Bar: React.FC<{ percent: number, color: string }> = ({ percent, color }) => (
     <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
        <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percent}%` }}></div>
    </div>
);

export const RepoHealthDashboard: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ChartBarIcon />
                    <span className="ml-3">Repo Health Dashboard (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of repository health metrics.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Build Status" value="Passing">
                    <div className="mt-2 text-green-400 font-bold">✓ Last build successful</div>
                </StatCard>
                <StatCard title="Open Issues" value="12">
                     <p className="text-xs text-slate-500 mt-2">3 High Priority</p>
                </StatCard>
                 <StatCard title="Pull Requests" value="4">
                    <p className="text-xs text-slate-500 mt-2">1 Needs Review</p>
                </StatCard>
                <StatCard title="Code Coverage" value="92%">
                    <Bar percent={92} color="bg-cyan-500" />
                </StatCard>
                <StatCard title="Dependency Health" value="98%">
                    <Bar percent={98} color="bg-green-500" />
                </StatCard>
                 <StatCard title="Average Cycle Time" value="2.5 days">
                     <p className="text-xs text-slate-500 mt-2">↓ 10% from last week</p>
                </StatCard>
            </div>
        </div>
    );
};