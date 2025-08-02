
import React, { useState, useMemo } from 'react';
import { CommandLineIcon } from '../icons/FeatureIcons';

const CronPartSelector: React.FC<{ label: string, value: string, onChange: (value: string) => void, options: (string|number)[] }> = ({ label, value, onChange, options }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-400">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700">
                <option value="*">* (every)</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
};

export const CronJobBuilder: React.FC = () => {
    const [minute, setMinute] = useState('0');
    const [hour, setHour] = useState('0');
    const [dayOfMonth, setDayOfMonth] = useState('*');
    const [month, setMonth] = useState('*');
    const [dayOfWeek, setDayOfWeek] = useState('*');
    
    const cronExpression = useMemo(() => {
        return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    }, [minute, hour, dayOfMonth, month, dayOfWeek]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CommandLineIcon />
                    <span className="ml-3">Cron Job Builder</span>
                </h1>
                <p className="text-slate-400 mt-1">Visually construct a cron expression for scheduling tasks.</p>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <CronPartSelector label="Minute" value={minute} onChange={setMinute} options={Array.from({length: 60}, (_, i) => i)} />
                <CronPartSelector label="Hour" value={hour} onChange={setHour} options={Array.from({length: 24}, (_, i) => i)} />
                <CronPartSelector label="Day (Month)" value={dayOfMonth} onChange={setDayOfMonth} options={Array.from({length: 31}, (_, i) => i + 1)} />
                <CronPartSelector label="Month" value={month} onChange={setMonth} options={Array.from({length: 12}, (_, i) => i + 1)} />
                <CronPartSelector label="Day (Week)" value={dayOfWeek} onChange={setDayOfWeek} options={Array.from({length: 7}, (_, i) => i)} />
            </div>
            <div className="bg-slate-900 p-4 rounded-lg text-center">
                <p className="text-slate-400 text-sm">Generated Expression</p>
                <p className="font-mono text-cyan-400 text-2xl mt-1">{cronExpression}</p>
                 <button onClick={() => navigator.clipboard.writeText(cronExpression)} className="mt-4 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs">Copy</button>
            </div>
        </div>
    );
};
