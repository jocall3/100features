// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

// README-style comment:
// This file contains the DebugSimulator component, an enterprise-grade React component
// designed to visually simulate a time-travel debugger. It features:
// - TypeScript for robust type checking of events, props, and state.
// - Enhanced state management for playback controls, event navigation, and search.
// - An `ErrorBoundary` component for increased resilience, catching JavaScript errors in its children.
// - Performance optimizations using `React.memo`, `useMemo`, and `useCallback` to prevent unnecessary re-renders.
// - An intuitive user interface with detailed event views, search functionality, and extended playback controls
//   (play/pause, step forward/backward, restart).
// - Accessibility improvements including ARIA attributes and semantic HTML for better user experience.
// - A `PrettifyJSON` utility component for readable, syntax-highlighted display of scope variables and event values.
// - A structured, maintainable, and scalable design, ready for integration into a larger React application.
// This component aims to provide a rich debugging experience simulation, making complex
// script execution flows understandable through a timeline-based interface.

import React, { useState, useEffect, useRef, useCallback, useMemo, ErrorInfo } from 'react';
import { BugAntIcon } from '../icons/FeatureIcons.tsx'; // Existing import
import { PlayIcon, PauseIcon, StepForwardIcon, StepBackwardIcon, ArrowPathIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid'; // New icons for controls

/**
 * @typedef {object} SourceLocation
 * @property {string} file - The file name where the event occurred.
 * @property {number} line - The line number in the source file (1-indexed).
 * @property {number} column - The column number in the source file (1-indexed).
 */
interface SourceLocation {
    file: string;
    line: number;
    column: number;
}

/**
 * @typedef {object} ScopeVariables
 * @property {string} [key: string] - Variable name.
 * @property {string | number | object | any} value - Variable value, can be stringified JSON or primitive.
 */
interface ScopeVariables {
    [key: string]: string | number | object | any;
}

/**
 * @typedef {object} DebugEvent
 * @property {number} time - The timestamp of the event in milliseconds from simulation start.
 * @property {'start' | 'call' | 'update' | 'return' | 'end' | 'log' | 'error'} type - The type of debug event.
 * @property {string} description - A human-readable description of the event.
 * @property {string[]} [stack] - An optional array representing the call stack, with the top of the stack first.
 * @property {ScopeVariables} [scope] - Optional scope variables (local variables, arguments) at the time of the event.
 * @property {SourceLocation} [sourceLocation] - Optional source code location where the event originated.
 * @property {any} [value] - Optional value associated with the event (e.g., return value of a function, logged data).
 */
export interface DebugEvent {
    time: number;
    type: 'start' | 'call' | 'update' | 'return' | 'end' | 'log' | 'error';
    description: string;
    stack?: string[];
    scope?: ScopeVariables;
    sourceLocation?: SourceLocation;
    value?: any;
}

/**
 * Mock debug events to simulate a script execution timeline.
 * These events include function calls, variable updates, returns, log messages, and errors,
 * providing a rich dataset for the debugger simulation.
 */
const mockEvents: DebugEvent[] = [
    { time: 0, type: 'start', description: 'Script execution started', sourceLocation: { file: 'script.js', line: 1, column: 1 } },
    { time: 50, type: 'call', description: '`calculateTotal` called', stack: ['global'], scope: { items: '[...]', taxRate: '0.07' }, sourceLocation: { file: 'script.js', line: 5, column: 10 } },
    { time: 100, type: 'log', description: 'Processing items array', value: { itemCount: 2 }, sourceLocation: { file: 'script.js', line: 6, column: 5 } },
    { time: 150, type: 'call', description: '`Array.reduce` called for sum', stack: ['calculateTotal', 'global'], scope: { accumulator: 0, currentItem: '{id: 1, price: 10}' }, sourceLocation: { file: 'script.js', line: 7, column: 15 } },
    { time: 200, type: 'update', description: '`accumulator` = 10 (item 1 processed)', stack: ['reduce', 'calculateTotal', 'global'], scope: { accumulator: 10, currentItem: '{id: 1, price: 10}' }, sourceLocation: { file: 'script.js', line: 8, column: 20 } },
    { time: 250, type: 'update', description: '`accumulator` = 30 (item 2 processed)', stack: ['reduce', 'calculateTotal', 'global'], scope: { accumulator: 30, currentItem: '{id: 2, price: 20}' }, sourceLocation: { file: 'script.js', line: 8, column: 20 } },
    { time: 300, type: 'return', description: '`Array.reduce` returns 30 (subtotal)', stack: ['calculateTotal', 'global'], scope: { subtotal: 30 }, value: 30, sourceLocation: { file: 'script.js', line: 7, column: 15 } },
    { time: 320, type: 'log', description: 'Applying tax to subtotal', value: '0.07', sourceLocation: { file: 'script.js', line: 9, column: 5 } },
    { time: 350, type: 'return', description: '`calculateTotal` returns 32.1', stack: ['global'], scope: { finalResult: 32.1 }, value: 32.1, sourceLocation: { file: 'script.js', line: 5, column: 10 } },
    { time: 380, type: 'error', description: 'Unexpected value encountered (simulated warning)', stack: ['global'], sourceLocation: { file: 'script.js', line: 12, column: 1 }, value: 'NaN' },
    { time: 400, type: 'end', description: 'Script execution finished', sourceLocation: { file: 'script.js', line: 13, column: 1 } },
];

/**
 * Calculates the maximum time from the mock events for the timeline slider.
 * This ensures the slider's range dynamically adjusts to the dataset.
 * @param {DebugEvent[]} events - The list of debug events.
 * @returns {number} The maximum time in milliseconds present in the events.
 */
const maxEventTime: number = Math.max(...mockEvents.map(e => e.time));

// Component: PrettifyJSON
/**
 * `PrettifyJSON` is a utility component designed to display JavaScript objects
 * (or JSON strings) in a human-readable, syntax-highlighted format within a `pre` tag.
 * It provides basic color coding for keys, strings, numbers, booleans, and null values
 * using Tailwind CSS classes.
 *
 * @component
 * @param {object} props - Component props.
 * @param {object | null | undefined} props.data - The JavaScript object or JSON-serializable data to display.
 */
export const PrettifyJSON: React.FC<{ data: object | null | undefined }> = React.memo(({ data }) => {
    if (data === null || data === undefined || (typeof data === 'object' && Object.keys(data).length === 0)) {
        return <pre className="font-mono text-sm text-slate-500">{'{}'}</pre>;
    }

    // Attempt to stringify if not already a string, otherwise use directly
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    // Basic regex-based highlighting for strings, numbers, booleans, and null
    // This is a simplified approach; a full syntax highlighter library would be used in production.
    const highlightedJson = jsonString
        .replace(/"(\w+)":/g, '<span class="text-sky-300">"$1"</span>:') // Keys
        .replace(/"([^"]*)"/g, '<span class="text-green-300">"$1"</span>') // String values
        .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="text-purple-300">$1</span>') // Numbers
        .replace(/\b(true|false)\b/g, '<span class="text-orange-300">$1</span>') // Booleans
        .replace(/\b(null)\b/g, '<span class="text-gray-400">$1</span>'); // null

    return (
        <pre className="font-mono text-xs overflow-x-auto p-1 rounded-sm bg-slate-900" dangerouslySetInnerHTML={{ __html: highlightedJson }} />
    );
});

// Component: ErrorBoundary
/**
 * `ErrorBoundary` is a robust React class component designed to catch JavaScript errors
 * anywhere in its child component tree. Instead of crashing the entire application,
 * it logs the error to the console and renders a user-friendly fallback UI.
 * This pattern significantly improves the stability and user experience of enterprise applications.
 *
 * @component
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    /**
     * `getDerivedStateFromError` is called after an error has been thrown by a descendant component.
     * It updates the state to trigger the fallback UI on the next render.
     * @param {Error} error - The error that was thrown.
     * @returns {{ hasError: boolean; error: Error }} An object to update the component's state.
     */
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    /**
     * `componentDidCatch` is called after an error has been thrown by a descendant component.
     * It is used for side effects, such as logging errors to an analytics service.
     * @param {Error} error - The error that was thrown.
     * @param {ErrorInfo} errorInfo - An object with a `componentStack` key, providing information about which component threw the error.
     */
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // In a real application, you would log this error to an external service like Sentry, LogRocket, or Splunk.
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI for when an error occurs
            return (
                <div className="p-8 bg-red-900/30 text-red-300 rounded-lg border border-red-700 flex flex-col items-center justify-center m-4">
                    <h2 className="text-xl font-bold mb-4">Oops! Something went wrong.</h2>
                    <p className="text-sm mb-4">We're sorry for the inconvenience. A critical error occurred within this component.</p>
                    {this.state.error && (
                        <details className="text-xs text-red-200 cursor-pointer">
                            <summary className="hover:text-red-100">Click for Error Details</summary>
                            <pre className="mt-2 p-3 bg-red-900 rounded overflow-x-auto whitespace-pre-wrap max-w-full text-left">{this.state.error.message}</pre>
                            {/* Uncomment below to display the full stack trace in development or for debugging */}
                            {/* {this.state.error.stack && <pre className="mt-2 p-3 bg-red-900 rounded overflow-x-auto whitespace-pre-wrap max-w-full text-left">{this.state.error.stack}</pre>} */}
                        </details>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * `DebugSimulatorProps` defines the props for the DebugSimulator component.
 * This interface is currently empty, but serves as a placeholder for future extensibility
 * (e.g., accepting a custom array of `DebugEvent`s, configuration options for playback).
 */
export interface DebugSimulatorProps {
    // initialEvents?: DebugEvent[]; // Example: Allow passing in custom events
    // playbackSpeed?: number; // Example: Allow controlling default playback speed
}

/**
 * `DebugSimulator` is the main component for simulating a time-travel debugger.
 * It orchestrates the display of mock debug events along a timeline,
 * providing interactive controls for playback, stepping through events, and
 * visualizing the application's state (call stack, scope variables) and event log.
 * The component is optimized for performance and includes accessibility features
 * to ensure a broad reach.
 *
 * @component
 * @param {DebugSimulatorProps} props - The props for the component.
 */
export const DebugSimulator: React.FC<DebugSimulatorProps> = React.memo(() => {
    const [time, setTime] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedEvent, setSelectedEvent] = useState<DebugEvent | null>(null);

    const intervalRef = useRef<number | null>(null);
    const eventLogRef = useRef<HTMLUListElement>(null); // Ref for auto-scrolling

    /**
     * Memoized list of events, filtered by the `searchTerm`.
     * Re-calculates only when `searchTerm` changes.
     */
    const filteredEvents = useMemo(() => {
        if (!searchTerm) {
            return mockEvents;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return mockEvents.filter(event =>
            event.description.toLowerCase().includes(lowerCaseSearchTerm) ||
            event.type.toLowerCase().includes(lowerCaseSearchTerm) ||
            event.stack?.some(s => s.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (event.value && JSON.stringify(event.value).toLowerCase().includes(lowerCaseSearchTerm))
        );
    }, [searchTerm]);

    /**
     * Memoized list of events that have occurred up to the current `time`.
     * Used for display in the event log to show past events.
     */
    const currentEventsAtTime = useMemo(() => {
        return filteredEvents.filter(e => e.time <= time);
    }, [filteredEvents, time]);

    /**
     * Memoized `activeEvent`, which is the latest event that has occurred at or before the current `time`.
     * This event determines the displayed call stack and scope variables.
     */
    const activeEvent = useMemo(() => {
        return currentEventsAtTime.slice().reverse().find(e => e.time <= time) || null;
    }, [currentEventsAtTime, time]);

    /**
     * Effect hook to manage the playback interval.
     * Starts the timer when `isPlaying` is true, stops it otherwise.
     * Clears the interval on component unmount or when `isPlaying` changes.
     */
    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = window.setInterval(() => {
                setTime(prev => {
                    const nextTime = prev + 10; // Increment time by 10ms
                    if (nextTime >= maxEventTime) {
                        setIsPlaying(false);
                        window.clearInterval(intervalRef.current!); // Clear interval if simulation ends
                        return maxEventTime; // Ensure time doesn't exceed max
                    }
                    return nextTime;
                });
            }, 100); // Update every 100ms (10ms * 10 updates/sec = 100ms per second simulated)

            return () => {
                if (intervalRef.current) {
                    window.clearInterval(intervalRef.current);
                }
            };
        } else {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
            }
        }
    }, [isPlaying, maxEventTime]); // Dependency array: re-run if isPlaying or maxEventTime changes

    /**
     * Effect hook to scroll the event log to the active event.
     * Triggered when `activeEvent` or `filteredEvents` change.
     */
    useEffect(() => {
        if (eventLogRef.current && activeEvent) {
            const activeElement = eventLogRef.current.querySelector(`[data-event-time="${activeEvent.time}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [activeEvent, filteredEvents]); // Also re-run if filteredEvents change, as index might shift

    /**
     * Handles changing the time via the timeline slider.
     * Pauses playback if the slider is manually adjusted.
     * @param {React.ChangeEvent<HTMLInputElement>} e - The change event from the slider.
     */
    const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = Number(e.target.value);
        setTime(newTime);
        setIsPlaying(false); // Always pause when manually dragging the slider
        if (newTime >= maxEventTime) {
            setIsPlaying(false); // Ensure pause if dragged to end
        }
    }, [maxEventTime]);

    /**
     * Toggles the play/pause state of the simulation.
     * If at the end of the timeline and attempting to play, it restarts from 0.
     */
    const togglePlayPause = useCallback(() => {
        setIsPlaying(prev => {
            if (!prev && time >= maxEventTime) { // If currently paused and at the end, restart
                setTime(0);
                setSelectedEvent(null); // Clear selected event on restart
            }
            return !prev;
        });
    }, [time, maxEventTime]);

    /**
     * Steps the simulation time forward to the next relevant event.
     * Pauses playback when stepping.
     */
    const stepForward = useCallback(() => {
        setIsPlaying(false);
        const nextEvent = filteredEvents.find(e => e.time > time);
        if (nextEvent) {
            setTime(nextEvent.time);
            setSelectedEvent(nextEvent);
        } else {
            setTime(maxEventTime); // Go to the end if no next event
            setSelectedEvent(filteredEvents.slice().reverse()[0] || null);
        }
    }, [time, filteredEvents, maxEventTime]);

    /**
     * Steps the simulation time backward to the previous relevant event.
     * Pauses playback when stepping.
     */
    const stepBackward = useCallback(() => {
        setIsPlaying(false);
        const prevEvent = filteredEvents.slice().reverse().find(e => e.time < time);
        if (prevEvent) {
            setTime(prevEvent.time);
            setSelectedEvent(prevEvent);
        } else {
            setTime(0); // Go to the start if no previous event
            setSelectedEvent(filteredEvents[0] || null);
        }
    }, [time, filteredEvents]);

    /**
     * Restarts the simulation from the beginning (time 0), pausing playback.
     */
    const restartSimulation = useCallback(() => {
        setIsPlaying(false);
        setTime(0);
        setSearchTerm(''); // Clear search on restart for a clean slate
        setSelectedEvent(mockEvents[0] || null); // Select the first event by default on restart
    }, []);

    /**
     * Handles clicking on an event in the log to select it and jump the timeline to its `time`.
     * Pauses playback when an event is manually selected.
     * @param {DebugEvent} event - The clicked debug event.
     */
    const handleEventClick = useCallback((event: DebugEvent) => {
        setSelectedEvent(event);
        setTime(event.time);
        setIsPlaying(false); // Pause when an event is clicked
    }, []);

    /**
     * Synchronizes the `selectedEvent` with the `activeEvent` when the timeline `time` changes,
     * unless an event was explicitly selected by click.
     */
    useEffect(() => {
        // If there's an active event and no selected event, or selected event doesn't match active, update it
        if (activeEvent && (!selectedEvent || selectedEvent.time !== activeEvent.time)) {
            setSelectedEvent(activeEvent);
        } else if (!activeEvent && selectedEvent) {
            // If no active event (e.g., time=0 before first event) but something is selected, clear selection
            setSelectedEvent(null);
        }
    }, [activeEvent, selectedEvent]); // Depend on activeEvent and selectedEvent to detect changes

    return (
        <ErrorBoundary>
            <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 font-sans">
                {/* Header Section */}
                <header className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <BugAntIcon className="w-8 h-8 text-cyan-500 mr-3" aria-hidden="true" />
                        <span>Timeline Debugger <span className="text-base text-slate-400 font-normal">(Simulation)</span></span>
                    </h1>
                    <p className="text-slate-400 mt-1 sr-only">A visual simulation of a time-travel debugger concept.</p>
                </header>

                {/* Main Content Area */}
                <div className="flex-grow flex flex-col gap-6 min-h-0">
                    {/* Playback Controls and Timeline */}
                    <section className="bg-slate-800/50 p-4 rounded-lg shadow-lg" aria-label="Timeline Playback Controls">
                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={restartSimulation}
                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                aria-label="Restart Simulation"
                                title="Restart Simulation"
                            >
                                <ArrowPathIcon className="w-5 h-5" aria-hidden="true" />
                            </button>
                            <button
                                onClick={stepBackward}
                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                aria-label="Step Backward"
                                title="Step Backward"
                            >
                                <StepBackwardIcon className="w-5 h-5" aria-hidden="true" />
                            </button>
                            <button
                                onClick={togglePlayPause}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-md flex items-center gap-2 min-w-[100px] justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                aria-label={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
                                title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
                            >
                                {isPlaying ? <PauseIcon className="w-5 h-5" aria-hidden="true" /> : <PlayIcon className="w-5 h-5" aria-hidden="true" />}
                                {isPlaying ? 'Pause' : 'Play'}
                            </button>
                            <button
                                onClick={stepForward}
                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                aria-label="Step Forward"
                                title="Step Forward"
                            >
                                <StepForwardIcon className="w-5 h-5" aria-hidden="true" />
                            </button>
                            <input
                                type="range"
                                min="0"
                                max={maxEventTime}
                                step="1"
                                value={time}
                                onChange={handleTimeChange}
                                className="flex-grow h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer timeline-slider focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                aria-label="Simulation Time Slider"
                                aria-valuemin={0}
                                aria-valuemax={maxEventTime}
                                aria-valuenow={time}
                                aria-valuetext={`${time} milliseconds`}
                            />
                            <span className="font-mono w-20 text-right text-slate-200 shrink-0">{time}ms</span>
                        </div>
                    </section>

                    {/* Debug Panels Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 flex-grow min-h-0">
                        {/* Left Column: Call Stack & Scope Variables */}
                        <div className="md:col-span-1 flex flex-col gap-6">
                            <section className="bg-slate-800/50 p-4 rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden" aria-labelledby="call-stack-heading">
                                <h3 id="call-stack-heading" className="font-bold mb-3 text-lg text-slate-200">Call Stack</h3>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <ul className="space-y-1 font-mono text-sm">
                                        {activeEvent?.stack?.length ? (
                                            activeEvent.stack.map((fn, i) => (
                                                <li
                                                    key={`stack-${i}`}
                                                    className={`px-2 py-1 rounded transition-colors ${i === 0 ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500' : 'text-slate-400 hover:bg-slate-700/50'}`}
                                                    role="listitem"
                                                    aria-current={i === 0 ? "location" : undefined}
                                                >
                                                    {fn}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-slate-500 italic">No active stack frame</li>
                                        )}
                                    </ul>
                                </div>
                            </section>
                            <section className="bg-slate-800/50 p-4 rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden" aria-labelledby="scope-variables-heading">
                                <h3 id="scope-variables-heading" className="font-bold mb-3 text-lg text-slate-200">Scope Variables</h3>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <PrettifyJSON data={activeEvent?.scope} />
                                </div>
                            </section>
                        </div>

                        {/* Right Columns (md:col-span-2, xl:col-span-3): Event Log & Detailed Event View/Source */}
                        <div className="md:col-span-2 xl:col-span-3 flex flex-col gap-6">
                            {/* Event Log */}
                            <section className="bg-slate-800/50 p-4 rounded-lg shadow-lg flex-grow min-h-[200px] flex flex-col overflow-hidden" aria-labelledby="event-log-heading">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 id="event-log-heading" className="font-bold text-lg text-slate-200">Event Log</h3>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search events..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 pr-3 py-1 bg-slate-700 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm w-full sm:w-auto"
                                            aria-label="Search events in log"
                                        />
                                        <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                aria-label="Clear search"
                                                title="Clear search"
                                            >
                                                <XMarkIcon className="w-4 h-4" aria-hidden="true" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <ul ref={eventLogRef} className="space-y-2 font-mono text-sm overflow-y-auto custom-scrollbar flex-1" role="list">
                                    {filteredEvents.length === 0 && searchTerm ? (
                                        <li className="text-slate-500 italic p-2">No events found matching "{searchTerm}".</li>
                                    ) : filteredEvents.length === 0 && !searchTerm ? (
                                        <li className="text-slate-500 italic p-2">No events to display.</li>
                                    ) : (
                                        filteredEvents.map(e => (
                                            <li
                                                key={e.time}
                                                data-event-time={e.time} // Custom attribute for scrolling
                                                className={`flex gap-4 p-2 rounded transition-colors cursor-pointer border border-transparent
                                                            ${e.time <= time ? 'bg-slate-800' : 'opacity-70 text-slate-400'}
                                                            ${selectedEvent?.time === e.time ? 'bg-cyan-700/30 border-cyan-500' : 'hover:bg-slate-700 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-800'}
                                                            `}
                                                onClick={() => handleEventClick(e)}
                                                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') handleEventClick(e); }}
                                                role="button"
                                                tabIndex={0}
                                                aria-current={selectedEvent?.time === e.time ? "true" : undefined}
                                                aria-label={`Event at ${e.time} milliseconds: ${e.description}`}
                                            >
                                                <span className="w-16 flex-shrink-0 text-slate-500">{e.time}ms</span>
                                                <span className={`flex-grow ${selectedEvent?.time === e.time ? 'text-cyan-200 font-medium' : 'text-slate-300'}`}>{e.description}</span>
                                                {e.type === 'error' && (
                                                    <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full text-xs font-semibold ml-auto flex-shrink-0">ERROR</span>
                                                )}
                                                {e.type === 'log' && (
                                                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs font-semibold ml-auto flex-shrink-0">LOG</span>
                                                )}
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </section>

                            {/* Detailed Event View / Source Code Panel */}
                            <section className="bg-slate-800/50 p-4 rounded-lg shadow-lg flex-grow min-h-[250px] overflow-hidden flex flex-col" aria-labelledby="detailed-event-heading">
                                <h3 id="detailed-event-heading" className="font-bold mb-3 text-lg text-slate-200">Detailed Event / Source</h3>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {!selectedEvent ? (
                                        <p className="text-slate-500 italic">Select an event from the log to view details.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="text-sm">
                                                <p className="text-slate-400 mb-1"><span className="font-bold text-slate-300">Time:</span> {selectedEvent.time}ms</p>
                                                <p className="text-slate-400 mb-1"><span className="font-bold text-slate-300">Type:</span> <span className={`capitalize px-2 py-0.5 rounded text-xs font-semibold ${
                                                    selectedEvent.type === 'error' ? 'bg-red-500/20 text-red-300' :
                                                    selectedEvent.type === 'log' ? 'bg-blue-500/20 text-blue-300' :
                                                    'bg-green-500/20 text-green-300'
                                                }`}>{selectedEvent.type}</span></p>
                                                <p className="text-slate-400 mb-1"><span className="font-bold text-slate-300">Description:</span> {selectedEvent.description}</p>
                                                {selectedEvent.sourceLocation && (
                                                    <p className="text-slate-400 mb-1"><span className="font-bold text-slate-300">Location:</span> {selectedEvent.sourceLocation.file}:{selectedEvent.sourceLocation.line}:{selectedEvent.sourceLocation.column}</p>
                                                )}
                                                {selectedEvent.value !== undefined && (
                                                    <div className="mt-3">
                                                        <p className="font-bold text-slate-300 mb-1">Value:</p>
                                                        <PrettifyJSON data={selectedEvent.value} />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Placeholder for actual code view with line highlighting */}
                                            <div className="bg-slate-900 p-3 rounded-md text-slate-300 font-mono text-xs overflow-x-auto">
                                                <h4 className="font-bold mb-2 text-slate-200">Source Code Snippet (Simulated)</h4>
                                                <pre>
                                                    {`// This is a simulated code snippet.
// In a real debugger, this would fetch and display actual source code.

1  function calculateTotal(items, taxRate) {
2      // Validate inputs (example for line 2)
`}
                                                    {selectedEvent.sourceLocation && selectedEvent.sourceLocation.line === 5 && (
                                                        <span className="bg-cyan-500/30 block py-1 px-2 -mx-2 my-1 border-l-4 border-cyan-500">
                                                            5 &gt; &nbsp;subtotal = items.reduce((acc, item) =&gt; acc + item.price, 0); {'// Current execution'}
                                                        </span>
                                                    )}
                                                    {selectedEvent.sourceLocation && selectedEvent.sourceLocation.line !== 5 && (
                                                        `5      subtotal = items.reduce((acc, item) => acc + item.price, 0);`
                                                    )}
                                                    {`
6      // Some more logic
`}
                                                    {selectedEvent.sourceLocation && selectedEvent.sourceLocation.line === 9 && (
                                                        <span className="bg-cyan-500/30 block py-1 px-2 -mx-2 my-1 border-l-4 border-cyan-500">
                                                            9 &gt; &nbsp;const total = subtotal * (1 + taxRate); {'// Current execution'}
                                                        </span>
                                                    )}
                                                     {selectedEvent.sourceLocation && selectedEvent.sourceLocation.line !== 9 && (
                                                        `9      const total = subtotal * (1 + taxRate);`
                                                    )}
                                                    {`
10     return total;
11 }

`}
                                                    {selectedEvent.sourceLocation && selectedEvent.sourceLocation.line === 12 && (
                                                        <span className="bg-red-500/30 block py-1 px-2 -mx-2 my-1 border-l-4 border-red-500">
                                                            12 &gt; &nbsp;console.warn("Potential division by zero!"); {'// Error point'}
                                                        </span>
                                                    )}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
});