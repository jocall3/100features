// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect, useMemo } from 'react';
import { ChartBarIcon } from '../icons/FeatureIcons.tsx';

type SortKey = 'name' | 'type' | 'size' | 'duration';
type SortDirection = 'asc' | 'desc';

export const NetworkVisualizer: React.FC = () => {
    const [requests, setRequests] = useState<PerformanceResourceTiming[]>([]);
    const [sortKey, setSortKey] = useState<SortKey>('duration');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    useEffect(() => {
        const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        setRequests(entries);
    }, []);
    
    const sortedRequests = useMemo(() => {
        return [...requests].sort((a, b) => {
            let valA, valB;
            if(sortKey === 'size') {
                 valA = a.transferSize;
                 valB = b.transferSize;
            } else {
                 valA = a[sortKey];
                 valB = b[sortKey];
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [requests, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };
    
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const SortableHeader: React.FC<{
        skey: SortKey;
        label: string;
    }> = ({ skey, label }) => (
        <th onClick={() => handleSort(skey)} className="p-2 text-left cursor-pointer hover:bg-slate-800">
            {label} {sortKey === skey && (sortDirection === 'asc' ? '▲' : '▼')}
        </th>
    );

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ChartBarIcon />
                    <span className="ml-3">Network Visualizer</span>
                </h1>
                <p className="text-slate-400 mt-1">Inspect network resources loaded by this page.</p>
            </header>
            <div className="flex-grow overflow-y-auto bg-slate-900 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-slate-900">
                        <tr>
                            <SortableHeader skey="name" label="Name" />
                            <SortableHeader skey="type" label="Type" />
                            <SortableHeader skey="size" label="Size" />
                            <SortableHeader skey="duration" label="Time" />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRequests.map((req, i) => (
                            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="p-2 text-cyan-400 truncate max-w-sm" title={req.name}>{req.name.split('/').pop()}</td>
                                <td className="p-2">{req.initiatorType}</td>
                                <td className="p-2">{formatBytes(req.transferSize)}</td>
                                <td className="p-2">{req.duration.toFixed(0)}ms</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};