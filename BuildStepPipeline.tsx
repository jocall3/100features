import React, { useState, useEffect } from 'react';
import { ChartBarIcon } from '../icons/FeatureIcons.tsx';

type Status = 'pending' | 'running' | 'success' | 'failure';
const steps = ['Install', 'Build', 'Lint', 'Test', 'Deploy'];

export const BuildStepPipeline: React.FC = () => {
    const [statuses, setStatuses] = useState<Status[]>(Array(steps.length).fill('pending'));
    const [isRunning, setIsRunning] = useState(false);

    const getStatusColor = (status: Status) => {
        switch (status) {
            case 'success': return 'border-green-500 bg-green-500/10 text-green-300';
            case 'failure': return 'border-red-500 bg-red-500/10 text-red-300';
            case 'running': return 'border-cyan-500 bg-cyan-500/10 text-cyan-300 animate-pulse';
            default: return 'border-slate-600 bg-slate-800/20 text-slate-400';
        }
    };
    
    const runPipeline = () => {
        setIsRunning(true);
        setStatuses(Array(steps.length).fill('pending'));
        let currentStep = 0;

        const interval = setInterval(() => {
            setStatuses(s => {
                const newStatuses = [...s];
                if(currentStep > 0) newStatuses[currentStep - 1] = 'success';
                if(currentStep < steps.length) newStatuses[currentStep] = 'running';
                return newStatuses;
            });

            if (currentStep >= steps.length) {
                clearInterval(interval);
                setIsRunning(false);
            }
            currentStep++;
        }, 1000);
    };

    useEffect(() => {
        runPipeline();
    }, []);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <ChartBarIcon />
                        <span className="ml-3">Build Step Visual Pipeline (Simulation)</span>
                    </h1>
                    <p className="text-slate-400 mt-1">A simulation of a CI/CD build pipeline.</p>
                </div>
                 <button
                    onClick={runPipeline}
                    disabled={isRunning}
                    className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md disabled:bg-slate-600"
                >
                    {isRunning ? 'Running...' : 'Rerun'}
                </button>
            </header>
            <div className="flex-grow flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    {steps.map((step, i) => (
                        <React.Fragment key={step}>
                            <div className={`p-4 rounded-lg border-2 w-32 h-24 flex items-center justify-center font-bold ${getStatusColor(statuses[i])}`}>
                                {step}
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`h-1 w-12 ${statuses[i] === 'success' || statuses[i] === 'running' ? 'bg-green-500' : 'bg-slate-600'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};