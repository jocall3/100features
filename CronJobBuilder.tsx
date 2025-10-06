// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

// This file implements a sophisticated Cron Job Builder component for enterprise-grade applications.
// It allows users to visually construct cron expressions, validates them, provides human-readable
// descriptions, offers predefined schedule shortcuts, and keeps a history of recently created expressions.
// The component is designed for maintainability, scalability, and enhanced user experience,
// incorporating TypeScript, performance optimizations, and accessibility features.

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CommandLineIcon, ClipboardDocumentIcon, CheckCircleIcon, ExclamationTriangleIcon, HistoryIcon } from '../icons/FeatureIcons';

// --- Type Definitions ---
/**
 * Represents the type of a cron expression part.
 */
export type CronPartType = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

/**
 * Interface for the options passed to the CronPartSelector.
 * Options can be string or number.
 */
export interface ICronPartOption {
    value: string;
    label: string;
}

/**
 * Props for the CronPartSelector component.
 */
export interface ICronPartSelectorProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: ICronPartOption[];
    ariaLabel?: string;
    helperText?: string;
}

/**
 * Interface for a predefined cron schedule.
 */
export interface IPredefinedCronSchedule {
    id: string;
    label: string;
    cron: string;
    description: string;
}

/**
 * Represents the result of a cron expression validation.
 */
export interface ICronValidationResult {
    isValid: boolean;
    message: string;
}

/**
 * Props for the CronJobBuilder component (currently none, but good practice).
 */
export interface ICronJobBuilderProps {
    // Potentially add a prop for an initial cron expression or a callback for when an expression is finalized
    // onExpressionChange?: (expression: string) => void;
    // initialCron?: string;
}

// --- Utility Functions ---

/**
 * Exports a utility function to validate a cron expression.
 * This is a basic validation and might not cover all edge cases of all cron implementations (e.g., Vixie vs. Quartz).
 *
 * @param cronExpression The cron string to validate.
 * @returns An object indicating validity and a message.
 */
export const validateCronExpression = (cronExpression: string): ICronValidationResult => {
    if (!cronExpression) {
        return { isValid: false, message: 'Cron expression cannot be empty.' };
    }

    const parts = cronExpression.split(/\s+/).filter(Boolean); // Split by whitespace and remove empty strings
    if (parts.length !== 5) {
        return { isValid: false, message: 'Cron expression must have exactly 5 parts: minute hour dayOfMonth month dayOfWeek.' };
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const isValidPart = (part: string, min: number, max: number, allowL?: boolean, allowW?: boolean, allowHash?: boolean) => {
        // Check for '*'
        if (part === '*') return true;

        // Check for '?' (specific to dayOfMonth and dayOfWeek in some cron implementations, but not standard in the 5-part format this builder targets)
        if (part === '?') return false; // For 5-part cron, '?' is typically not allowed or means a different thing

        // Check for ranges (e.g., 1-5)
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) return false;
            return true;
        }

        // Check for step values (e.g., */5, 1-5/2)
        if (part.includes('/')) {
            const [base, step] = part.split('/');
            if (base === '*') { // e.g., */5
                const s = Number(step);
                return !isNaN(s) && s > 0;
            } else if (base.includes('-')) { // e.g., 1-10/2
                const [start, end] = base.split('-').map(Number);
                const s = Number(step);
                return !isNaN(start) && !isNaN(end) && !isNaN(s) && start >= min && end <= max && start <= end && s > 0;
            } else { // e.g., 5/2 (less common, usually means 5, then 5+2, 5+2+2 etc.)
                const b = Number(base);
                const s = Number(step);
                return !isNaN(b) && !isNaN(s) && b >= min && b <= max && s > 0;
            }
        }

        // Check for lists (e.g., 1,5,10)
        if (part.includes(',')) {
            const items = part.split(',').map(Number);
            return items.every(item => !isNaN(item) && item >= min && item <= max);
        }

        // Check for single numeric values
        const num = Number(part);
        if (!isNaN(num) && num >= min && num <= max) return true;

        // Check for special characters like 'L', 'W', '#' which are usually for dayOfMonth/dayOfWeek and can be complex.
        // For simplicity, this builder only supports numeric values and * for these.
        if (allowL && part.includes('L')) { // Last day of month or week
            if (part === 'L') return true; // Last day of month
            if (part.endsWith('L') && !isNaN(Number(part.slice(0, -1)))) { // e.g. 5L (5th day from end of month)
                const numVal = Number(part.slice(0, -1));
                return numVal >= 1 && numVal <= 7; // Only relevant for day of week L
            }
        }
        if (allowW && part.endsWith('W')) { // Nearest weekday
            const numVal = Number(part.slice(0, -1));
            return !isNaN(numVal) && numVal >= 1 && numVal <= 31; // For dayOfMonth
        }
        if (allowHash && part.includes('#')) { // Nth day of week
             const [day, nth] = part.split('#').map(Number);
             return !isNaN(day) && !isNaN(nth) && day >= 0 && day <= 6 && nth >= 1 && nth <= 5;
        }


        return false;
    };

    if (!isValidPart(minute, 0, 59)) return { isValid: false, message: 'Invalid minute part (0-59).' };
    if (!isValidPart(hour, 0, 23)) return { isValid: false, message: 'Invalid hour part (0-23).' };
    if (!isValidPart(dayOfMonth, 1, 31, true, true)) return { isValid: false, message: 'Invalid day of month part (1-31, L, W).' };
    if (!isValidPart(month, 1, 12)) return { isValid: false, message: 'Invalid month part (1-12).' };
    if (!isValidPart(dayOfWeek, 0, 6, true, false, true)) return { isValid: false, message: 'Invalid day of week part (0-6, L, #).' }; // 0 = Sunday, 6 = Saturday

    return { isValid: true, message: 'Cron expression is valid.' };
};

/**
 * Exports a utility function to generate a human-readable description from a cron expression.
 * This function provides a basic interpretation. More complex cron expressions might require
 * a dedicated library for full accuracy.
 *
 * @param cronExpression The cron string to describe.
 * @returns A human-readable string description.
 */
export const describeCronExpression = (cronExpression: string): string => {
    const parts = cronExpression.split(/\s+/).filter(Boolean);
    if (parts.length !== 5) {
        return 'Invalid cron expression format.';
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const minuteDesc = (val: string) => {
        if (val === '*') return 'every minute';
        if (val.includes('/')) {
            const [, step] = val.split('/');
            return `every ${step} minutes`;
        }
        return `at ${val} minutes past the hour`;
    };

    const hourDesc = (val: string) => {
        if (val === '*') return 'every hour';
        if (val.includes('/')) {
            const [, step] = val.split('/');
            return `every ${step} hours`;
        }
        return `at ${val}:00`;
    };

    const dayOfMonthDesc = (val: string) => {
        if (val === '*') return 'every day of the month';
        if (val === 'L') return 'on the last day of the month';
        return `on day ${val} of the month`;
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthDesc = (val: string) => {
        if (val === '*') return 'every month';
        if (val.includes(',')) {
            const months = val.split(',').map(m => monthNames[parseInt(m) - 1]).join(', ');
            return `in ${months}`;
        }
        return `in ${monthNames[parseInt(val) - 1]}`;
    };

    const dayOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekDesc = (val: string) => {
        if (val === '*') return 'every day of the week';
        if (val.includes(',')) {
            const days = val.split(',').map(d => dayOfWeekNames[parseInt(d)]).join(', ');
            return `on ${days}`;
        }
        if (val === 'L') return 'on the last day of the week'; // This would usually be the last Saturday/Sunday
        if (val.includes('#')) {
            const [dayNum, nth] = val.split('#');
            return `on the ${nth}${nth === '1' ? 'st' : nth === '2' ? 'nd' : nth === '3' ? 'rd' : 'th'} ${dayOfWeekNames[parseInt(dayNum)]} of the month`;
        }
        return `on ${dayOfWeekNames[parseInt(val)]}`;
    };

    let description = `Runs ${minuteDesc(minute)} ${hourDesc(hour)} ${dayOfMonthDesc(dayOfMonth)} ${monthDesc(month)} ${dayOfWeekDesc(dayOfWeek)}.`;

    // Simple cleanup for common overlaps:
    description = description.replace('at 0 minutes past the hour every hour', 'every hour');
    description = description.replace('every minute at 0:00 every hour', 'every minute of every hour'); // e.g. * *
    description = description.replace('every day of the month every month every day of the week', 'every day'); // e.g. * * * * *

    return description.charAt(0).toUpperCase() + description.slice(1);
};


// --- React Components ---

/**
 * A memoized functional component for selecting a single part of a cron expression.
 * It provides a dropdown with predefined options and displays a label and optional helper text.
 */
export const CronPartSelector: React.FC<ICronPartSelectorProps> = React.memo(({ label, value, onChange, options, ariaLabel, helperText }) => {
    const id = `cron-part-selector-${label.toLowerCase().replace(/\s/g, '-')}`;
    return (
        <div className="flex flex-col">
            <label htmlFor={id} className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
            <select
                id={id}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors duration-200"
                aria-label={ariaLabel || `Select ${label}`}
            >
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
            {helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
        </div>
    );
});

/**
 * Exports a component to display predefined cron schedules.
 * Users can click on these to quickly set up common cron jobs.
 */
export const CronPredefinedSchedules: React.FC<{ onSelect: (cron: string) => void }> = React.memo(({ onSelect }) => {
    const predefined: IPredefinedCronSchedule[] = useMemo(() => [
        { id: 'hourly', label: 'Every Hour', cron: '0 * * * *', description: 'At 0 minutes past the hour, every hour.' },
        { id: 'daily', label: 'Every Day (Midnight)', cron: '0 0 * * *', description: 'At 00:00 (midnight) every day.' },
        { id: 'weekly', label: 'Every Week (Sunday Midnight)', cron: '0 0 * * 0', description: 'At 00:00 (midnight) every Sunday.' },
        { id: 'monthly', label: 'Every Month (1st, Midnight)', cron: '0 0 1 * *', description: 'At 00:00 (midnight), on day 1 of the month, every month.' },
        { id: 'every5mins', label: 'Every 5 Minutes', cron: '*/5 * * * *', description: 'Every 5 minutes.' },
        { id: 'every15mins', label: 'Every 15 Minutes', cron: '*/15 * * * *', description: 'Every 15 minutes.' },
    ], []);

    return (
        <div className="bg-slate-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center">
                <HistoryIcon className="h-5 w-5 mr-2 text-cyan-400" /> Predefined Schedules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {predefined.map(schedule => (
                    <button
                        key={schedule.id}
                        onClick={() => onSelect(schedule.cron)}
                        className="flex flex-col items-start px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors duration-200 text-left"
                        aria-label={`Select predefined schedule: ${schedule.label}. Cron: ${schedule.cron}`}
                    >
                        <span className="text-cyan-300 font-mono text-sm">{schedule.label}</span>
                        <span className="text-slate-400 text-xs mt-1">{schedule.description}</span>
                    </button>
                ))}
            </div>
        </div>
    );
});


/**
 * Exports a custom hook to manage recent cron expressions in localStorage.
 */
export const useRecentCronExpressions = (maxHistory: number = 5) => {
    const LS_KEY = 'recentCronExpressions';
    const [history, setHistory] = useState<string[]>(() => {
        try {
            const storedHistory = localStorage.getItem(LS_KEY);
            return storedHistory ? JSON.parse(storedHistory) : [];
        } catch (error) {
            console.error('Failed to load cron history from localStorage:', error);
            return [];
        }
    });

    const addExpression = useCallback((expression: string) => {
        setHistory(prevHistory => {
            const newHistory = [expression, ...prevHistory.filter(exp => exp !== expression)].slice(0, maxHistory);
            try {
                localStorage.setItem(LS_KEY, JSON.stringify(newHistory));
            } catch (error) {
                console.error('Failed to save cron history to localStorage:', error);
            }
            return newHistory;
        });
    }, [maxHistory]);

    const clearHistory = useCallback(() => {
        setHistory([]);
        try {
            localStorage.removeItem(LS_KEY);
        } catch (error) {
            console.error('Failed to clear cron history from localStorage:', error);
        }
    }, []);

    return { history, addExpression, clearHistory };
};

/**
 * Exports a component to display a list of recent cron expressions.
 */
export const RecentCronExpressionsDisplay: React.FC<{ onSelect: (cron: string) => void }> = React.memo(({ onSelect }) => {
    const { history, clearHistory } = useRecentCronExpressions(5); // Show last 5 expressions

    if (history.length === 0) {
        return null; // Or a message indicating no history
    }

    return (
        <div className="bg-slate-900 p-4 rounded-lg mt-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center">
                <HistoryIcon className="h-5 w-5 mr-2 text-yellow-400" /> Recent Expressions
            </h3>
            <ul className="space-y-2">
                {history.map((cron, index) => (
                    <li key={index} className="flex justify-between items-center bg-slate-800 p-3 rounded-md">
                        <span className="font-mono text-cyan-300 text-sm">{cron}</span>
                        <button
                            onClick={() => onSelect(cron)}
                            className="ml-3 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs text-slate-200"
                            aria-label={`Load cron expression ${cron}`}
                        >
                            Load
                        </button>
                    </li>
                ))}
            </ul>
            <button
                onClick={clearHistory}
                className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-md text-sm text-white transition-colors duration-200"
                aria-label="Clear all recent cron expressions history"
            >
                Clear History
            </button>
        </div>
    );
});

/**
 * The main Cron Job Builder component.
 * It integrates all the functionality for building, validating, describing, and managing cron expressions.
 */
export const CronJobBuilder: React.FC<ICronJobBuilderProps> = () => {
    const [minute, setMinute] = useState('0');
    const [hour, setHour] = useState('0');
    const [dayOfMonth, setDayOfMonth] = useState('*');
    const [month, setMonth] = useState('*');
    const [dayOfWeek, setDayOfWeek] = useState('*');
    const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const { addExpression } = useRecentCronExpressions();

    const cronExpression = useMemo(() => {
        return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    }, [minute, hour, dayOfMonth, month, dayOfWeek]);

    const validationResult = useMemo(() => validateCronExpression(cronExpression), [cronExpression]);
    const description = useMemo(() => describeCronExpression(cronExpression), [cronExpression]);

    // Store valid expressions in history
    useEffect(() => {
        if (validationResult.isValid) {
            addExpression(cronExpression);
        }
    }, [cronExpression, validationResult.isValid, addExpression]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(cronExpression);
            setCopyStatus('success');
        } catch (err) {
            console.error('Failed to copy cron expression:', err);
            setCopyStatus('error');
        } finally {
            setTimeout(() => setCopyStatus('idle'), 2000); // Reset status after 2 seconds
        }
    }, [cronExpression]);

    const applyCronExpression = useCallback((cron: string) => {
        const parts = cron.split(/\s+/);
        if (parts.length === 5) {
            setMinute(parts[0]);
            setHour(parts[1]);
            setDayOfMonth(parts[2]);
            setMonth(parts[3]);
            setDayOfWeek(parts[4]);
        }
    }, []);

    // Memoize options arrays for CronPartSelector to prevent unnecessary re-renders
    const minuteOptions: ICronPartOption[] = useMemo(() => [
        { value: '*', label: '* (every)' },
        ...Array.from({ length: 60 }, (_, i) => ({ value: String(i), label: String(i) }))
    ], []);
    const hourOptions: ICronPartOption[] = useMemo(() => [
        { value: '*', label: '* (every)' },
        ...Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: String(i) }))
    ], []);
    const dayOfMonthOptions: ICronPartOption[] = useMemo(() => [
        { value: '*', label: '* (every)' },
        { value: 'L', label: 'L (last day)' }, // Example for 'L'
        ...Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))
    ], []);
    const monthOptions: ICronPartOption[] = useMemo(() => [
        { value: '*', label: '* (every)' },
        ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))
    ], []);
    const dayOfWeekOptions: ICronPartOption[] = useMemo(() => [
        { value: '*', label: '* (every)' },
        { value: '0', label: '0 (Sunday)' },
        { value: '1', label: '1 (Monday)' },
        { value: '2', label: '2 (Tuesday)' },
        { value: '3', label: '3 (Wednesday)' },
        { value: '4', label: '4 (Thursday)' },
        { value: '5', label: '5 (Friday)' },
        { value: '6', label: '6 (Saturday)' },
        { value: 'L', label: 'L (last day of week)' }, // Example for 'L'
    ], []);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CommandLineIcon className="h-8 w-8 text-cyan-400" aria-hidden="true" />
                    <span className="ml-3">Cron Job Builder</span>
                </h1>
                <p className="text-slate-400 mt-1">Visually construct a cron expression for scheduling tasks.</p>
            </header>

            <section className="mb-6">
                <CronPredefinedSchedules onSelect={applyCronExpression} />
            </section>

            <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <CronPartSelector
                    label="Minute"
                    value={minute}
                    onChange={setMinute}
                    options={minuteOptions}
                    ariaLabel="Select minute for cron expression"
                    helperText="0-59"
                />
                <CronPartSelector
                    label="Hour"
                    value={hour}
                    onChange={setHour}
                    options={hourOptions}
                    ariaLabel="Select hour for cron expression"
                    helperText="0-23"
                />
                <CronPartSelector
                    label="Day (Month)"
                    value={dayOfMonth}
                    onChange={setDayOfMonth}
                    options={dayOfMonthOptions}
                    ariaLabel="Select day of month for cron expression"
                    helperText="1-31, L (last day)"
                />
                <CronPartSelector
                    label="Month"
                    value={month}
                    onChange={setMonth}
                    options={monthOptions}
                    ariaLabel="Select month for cron expression"
                    helperText="1-12 (Jan-Dec)"
                />
                <CronPartSelector
                    label="Day (Week)"
                    value={dayOfWeek}
                    onChange={setDayOfWeek}
                    options={dayOfWeekOptions}
                    ariaLabel="Select day of week for cron expression"
                    helperText="0-6 (Sun-Sat), L (last day)"
                />
            </section>

            <section className="bg-slate-800 p-4 rounded-lg text-center flex flex-col items-center mb-6">
                <p className="text-slate-400 text-sm mb-2">Generated Cron Expression</p>
                <div className="flex items-center justify-center space-x-2 w-full">
                    <p className="font-mono text-cyan-400 text-2xl break-all">{cronExpression}</p>
                    <button
                        onClick={handleCopy}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors duration-200 flex items-center justify-center text-xs text-slate-200"
                        aria-label="Copy cron expression to clipboard"
                    >
                        {copyStatus === 'success' ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-400" />
                        ) : copyStatus === 'error' ? (
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                        ) : (
                            <ClipboardDocumentIcon className="h-4 w-4 text-slate-200" />
                        )}
                        <span className="ml-1 sr-only sm:not-sr-only">
                            {copyStatus === 'success' ? 'Copied!' : copyStatus === 'error' ? 'Failed' : 'Copy'}
                        </span>
                    </button>
                </div>

                <div className={`mt-3 p-2 rounded-md w-full text-sm flex items-center justify-center ${validationResult.isValid ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'}`}>
                    {validationResult.isValid ? (
                        <CheckCircleIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                    ) : (
                        <ExclamationTriangleIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                    )}
                    <span>{validationResult.message}</span>
                </div>

                {validationResult.isValid && description && (
                    <p className="mt-4 text-slate-300 text-md text-center" aria-live="polite">
                        <span className="font-semibold">Description:</span> {description}
                    </p>
                )}
            </section>

            <section className="flex-grow">
                <RecentCronExpressionsDisplay onSelect={applyCronExpression} />
            </section>
        </div>
    );
};