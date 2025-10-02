// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect } from 'react';
import { ServerIcon } from '../icons/FeatureIcons';
import { JsonTreeNavigator } from './JsonTreeNavigator';

interface Request {
    id: number;
    time: string;
    body: any;
}

const mockPayloads = [
    { event: 'user.created', user: { id: 'usr_123', name: 'Alice' } },
    { event: 'payment.succeeded', amount: 1000, currency: 'usd' },
    { event: 'issue.opened', issue: { id: 42, title: 'Fix the button' } },
];

export const WebhookTester: React.FC = () => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const uniqueId = React.useMemo(() => Math.random().toString(36).substring(7), []);

    useEffect(() => {
        const interval = setInterval(() => {
            setRequests(prev => {
                const newRequest: Request = {
                    id: Date.now(),
                    time: new Date().toLocaleTimeString(),
                    body: mockPayloads[Math.floor(Math.random() * mockPayloads.length)],
                };
                return [newRequest, ...prev];
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const endpointUrl = `https://devcore.proxy/hook/${uniqueId}`;
    
    const handleCopy = () => {
        navigator.clipboard.writeText(endpointUrl);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ServerIcon />
                    <span className="ml-3">Webhook Tester (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">Receive and inspect simulated webhook requests.</p>
            </header>
             <div className="flex items-center gap-2 mb-4 bg-slate-800/50 p-3 rounded-lg">
                <span className="font-mono text-cyan-400 text-sm">{endpointUrl}</span>
                <button onClick={handleCopy} className="ml-auto px-3 py-1 bg-slate-700 text-xs rounded-md">Copy URL</button>
            </div>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <aside className="lg:col-span-1 bg-slate-900 p-2 rounded-lg flex flex-col">
                     <h3 className="font-bold p-2">Incoming Requests</h3>
                    <div className="space-y-1 flex-grow overflow-y-auto">
                        {requests.map(req => (
                            <button 
                                key={req.id} 
                                onClick={() => setSelectedRequest(req)}
                                className={`w-full text-left p-2 rounded-md font-mono text-xs ${selectedRequest?.id === req.id ? 'bg-cyan-500/20' : 'hover:bg-slate-800'}`}
                            >
                                <div className="flex justify-between">
                                    <span>POST</span>
                                    <span className="text-slate-500">{req.time}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>
                <main className="lg:col-span-2 bg-slate-800/50 p-4 rounded-lg overflow-y-auto">
                     {selectedRequest ? (
                        <JsonTreeNavigator data={selectedRequest.body} />
                     ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            Select a request to view its payload.
                        </div>
                     )}
                </main>
            </div>
        </div>
    );
};