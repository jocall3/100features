// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

// This file provides an enhanced and enterprise-grade React component for monitoring
// CPU and RAM usage. It features a custom hook for managing simulation data,
// a reusable sub-component for rendering resource charts, and includes
// accessibility improvements, configurable options, and better state management.
// It's designed to be easily integrated into a larger application, offering
// robustness, maintainability, and scalability.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChartBarIcon } from '../icons/FeatureIcons.tsx';

/**
 * Interface for the properties of the CpuRamOverlay component.
 */
export interface CpuRamOverlayProps {
    /**
     * The maximum number of data points to display on each chart.
     * This affects the visual history length.
     * @default 50
     */
    maxPoints?: number;
    /**
     * The interval in milliseconds at which the resource data is updated.
     * @default 500
     */
    updateIntervalMs?: number;
    /**
     * If true, the monitoring simulation will start in a paused state.
     * @default false
     */
    startPaused?: boolean;
    /**
     * An optional threshold value for CPU usage (0-100) to be displayed as a line on the chart.
     */
    cpuThreshold?: number;
    /**
     * An optional threshold value for RAM usage (0-100) to be displayed as a line on the chart.
     */
    ramThreshold?: number;
}

/**
 * Interface for the properties of the ResourceChart sub-component.
 */
interface ResourceChartProps {
    /**
     * An array of numerical data points (0-100) to be plotted.
     */
    data: number[];
    /**
     * The SVG stroke color for the chart line. This should be a valid CSS color string.
     */
    color: string;
    /**
     * The title displayed above the chart.
     */
    title: string;
    /**
     * The unit of measurement for the resource (e.g., '%', 'GB').
     */
    unit: string;
    /**
     * The maximum number of points the chart is designed to display.
     * Used for scaling the X-axis to ensure consistent width across charts.
     */
    maxDataPoints: number;
    /**
     * An optional threshold value (0-100) to display as a horizontal line on the chart.
     */
    threshold?: number;
    /**
     * An accessibility label for the SVG element, describing its content.
     */
    ariaLabel: string;
    /**
     * The value representing the last data point. Useful for displaying alongside the title.
     */
    currentValue: number;
}

/**
 * `ResourceChart` is a memoized sub-component responsible for rendering
 * a single SVG line chart for a given resource (CPU or RAM).
 * It includes accessibility features, basic grid lines, and supports an optional threshold line.
 *
 * @param {ResourceChartProps} props - The properties for the chart.
 * @returns {JSX.Element} A React functional component rendering an SVG chart.
 */
export const ResourceChart: React.FC<ResourceChartProps> = React.memo(({
    data,
    color,
    title,
    unit,
    maxDataPoints,
    threshold,
    ariaLabel,
    currentValue
}) => {
    /**
     * Generates the SVG path string for the data points.
     * The X-coordinate is scaled based on the index and `maxDataPoints`.
     * The Y-coordinate is inverted (100 - value) because SVG Y-axis starts from top.
     * @param {number[]} chartData - The array of numbers (0-100) to plot.
     * @param {number} maxPts - The maximum number of points for X-axis scaling.
     * @returns {string} The SVG path data string.
     */
    const renderPath = useCallback((chartData: number[], maxPts: number): string => {
        if (chartData.length < 2) return '';
        const points = chartData.map((p, i) => `${(i / (maxPts - 1)) * 100},${100 - p}`).join(' L');
        return `M ${points}`;
    }, []);

    // Memoize the path generation to prevent unnecessary re-renders of the path string
    const pathD = useMemo(() => renderPath(data, maxDataPoints), [data, maxDataPoints, renderPath]);

    return (
        <div className="bg-slate-900 p-4 rounded-lg shadow-md">
            <h3 className={`font-bold ${color === '#06b6d4' ? 'text-cyan-400' : 'text-purple-400'} flex justify-between items-baseline`}>
                <span>{title} (<span className="tabular-nums">{currentValue.toFixed(0)}</span>{unit})</span>
            </h3>
            <svg
                viewBox="0 0 100 100"
                className="w-full h-32 mt-2"
                preserveAspectRatio="none"
                role="img"
                aria-label={ariaLabel}
            >
                {/* Horizontal grid lines */}
                {[20, 40, 60, 80].map(y => (
                    <line key={`grid-h-${y}`} x1="0" y1={100 - y} x2="100" y2={100 - y} stroke="#2d3748" strokeWidth="0.2" strokeDasharray="1,1" />
                ))}
                {/* Vertical grid lines - adjusted for better visual distribution */}
                 {[0, 25, 50, 75, 100].map(x => (
                    <line key={`grid-v-${x}`} x1={x} y1="0" x2={x} y2="100" stroke="#2d3748" strokeWidth="0.2" strokeDasharray="1,1" />
                ))}

                {/* Main data path for the resource usage */}
                <path d={pathD} stroke={color} fill="none" strokeWidth="2" />

                {/* Optional Threshold Line */}
                {threshold !== undefined && threshold >= 0 && threshold <= 100 && (
                    <line
                        x1="0"
                        y1={100 - threshold}
                        x2="100"
                        y2={100 - threshold}
                        stroke="#ef4444" // A distinct red color for the threshold
                        strokeWidth="1"
                        strokeDasharray="4 2"
                        aria-label={`${title} Threshold at ${threshold}${unit}`}
                    />
                )}
            </svg>
        </div>
    );
});

/**
 * Interface for the return value of the `useSystemMonitor` hook.
 */
export interface UseSystemMonitorReturn {
    /** An array of historical CPU usage data points. */
    cpuData: number[];
    /** An array of historical RAM usage data points. */
    ramData: number[];
    /** True if monitoring is active, false if paused. */
    isMonitoring: boolean;
    /** Function to toggle the monitoring state. */
    toggleMonitoring: () => void;
    /** Function to clear all historical data. */
    resetData: () => void;
    /** Current status message ('Monitoring' or 'Paused'). */
    status: 'Monitoring' | 'Paused';
}

/**
 * `useSystemMonitor` is a custom React hook that manages the simulated
 * CPU and RAM usage data. It handles updating the data at a specified interval
 * and provides controls to pause/resume monitoring and reset the data.
 * This hook encapsulates the data fetching/simulation logic, making the component
 * cleaner and the logic reusable.
 *
 * @param {number} maxPoints - The maximum number of data points to keep in history for each resource.
 * @param {number} intervalMs - The interval in milliseconds for data updates.
 * @param {boolean} startPaused - If true, the monitoring starts in a paused state.
 * @returns {UseSystemMonitorReturn} An object containing resource data, monitoring status, and controls.
 */
export const useSystemMonitor = (
    maxPoints: number = 50,
    intervalMs: number = 500,
    startPaused: boolean = false
): UseSystemMonitorReturn => {
    const [cpuData, setCpuData] = useState<number[]>([]);
    const [ramData, setRamData] = useState<number[]>([]);
    const [isMonitoring, setIsMonitoring] = useState<boolean>(!startPaused);

    useEffect(() => {
        if (!isMonitoring) {
            return; // If monitoring is paused, clear any active interval and do not create a new one.
        }

        const intervalId = window.setInterval(() => {
            // Simulate CPU data: values between 10% and 90%
            setCpuData(prev => [...prev.slice(-maxPoints + 1), Math.random() * 80 + 10]);
            // Simulate RAM data: values between 20% and 80%
            setRamData(prev => [...prev.slice(-maxPoints + 1), Math.random() * 60 + 20]);
        }, intervalMs);

        // Cleanup function: Clear the interval when the component unmounts or dependencies change
        return () => window.clearInterval(intervalId);
    }, [isMonitoring, maxPoints, intervalMs]); // Re-run effect if monitoring status or config changes

    /**
     * Toggles the monitoring state between active and paused.
     * Memoized using useCallback to prevent unnecessary re-creations.
     */
    const toggleMonitoring = useCallback(() => {
        setIsMonitoring(prev => !prev);
    }, []);

    /**
     * Resets both CPU and RAM data arrays, effectively clearing the charts.
     * Memoized using useCallback.
     */
    const resetData = useCallback(() => {
        setCpuData([]);
        setRamData([]);
    }, []);

    const status = isMonitoring ? 'Monitoring' : 'Paused';

    return { cpuData, ramData, isMonitoring, toggleMonitoring, resetData, status };
};

/**
 * `CpuRamOverlay` is the main component that displays real-time (simulated)
 * CPU and RAM usage in an overlay format. It utilizes the `useSystemMonitor` hook
 * for data management and the `ResourceChart` sub-component for rendering.
 * It provides user controls to pause/resume the monitoring and reset the data,
 * demonstrating best practices for component encapsulation, state management,
 * and user interaction in a production-ready application.
 *
 * @param {CpuRamOverlayProps} props - Properties for configuring the overlay.
 * @returns {JSX.Element} A React functional component for CPU/RAM usage display.
 */
export const CpuRamOverlay: React.FC<CpuRamOverlayProps> = React.memo(({
    maxPoints = 50,
    updateIntervalMs = 500,
    startPaused = false,
    cpuThreshold,
    ramThreshold
}) => {
    // Utilize the custom hook to manage system monitoring logic and state
    const { cpuData, ramData, isMonitoring, toggleMonitoring, resetData, status } = useSystemMonitor(
        maxPoints,
        updateIntervalMs,
        startPaused
    );

    // Get the most recent data points for display
    const currentCpuUsage = cpuData.slice(-1)[0] || 0;
    const currentRamUsage = ramData.slice(-1)[0] || 0;

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
            {/* Header Section */}
            <header className="mb-6 border-b border-slate-700 pb-4">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center mb-2">
                    <ChartBarIcon className="w-8 h-8 text-cyan-400" /> {/* Icon with added color for branding */}
                    <span className="ml-3">System Resource Monitor</span>
                </h1>
                <p className="text-slate-400 mt-1 text-sm sm:text-base">
                    A real-time simulation of system resource monitoring, demonstrating component encapsulation, custom hooks, and interactive controls.
                </p>
            </header>

            {/* Controls Section */}
            <section className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center space-x-2 text-slate-300">
                    <span
                        className={`h-3 w-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'} animate-pulse-slow`}
                        aria-hidden="true" // Decorative indicator
                    />
                    <span className="font-semibold" aria-live="polite">Status: {status}</span>
                </div>
                <div className="flex space-x-4">
                    <button
                        onClick={toggleMonitoring}
                        className={`px-4 py-2 rounded-md font-medium text-white transition-colors duration-200
                                    ${isMonitoring ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
                        aria-label={isMonitoring ? "Pause system monitoring" : "Resume system monitoring"}
                    >
                        {isMonitoring ? 'Pause Monitor' : 'Resume Monitor'}
                    </button>
                    <button
                        onClick={resetData}
                        className="px-4 py-2 rounded-md font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
                        aria-label="Reset chart data"
                    >
                        Reset Data
                    </button>
                </div>
            </section>

            {/* Charts Grid Section */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResourceChart
                    data={cpuData}
                    color="#06b6d4" // Tailwind cyan-500
                    title="CPU Usage"
                    unit="%"
                    maxDataPoints={maxPoints}
                    threshold={cpuThreshold}
                    ariaLabel={`CPU Usage Chart. Current usage is ${currentCpuUsage.toFixed(0)} percent. ${cpuThreshold ? `Monitoring threshold set at ${cpuThreshold} percent.` : 'No threshold set.'}`}
                    currentValue={currentCpuUsage}
                />
                <ResourceChart
                    data={ramData}
                    color="#a855f7" // Tailwind purple-500
                    title="RAM Usage"
                    unit="%"
                    maxDataPoints={maxPoints}
                    threshold={ramThreshold}
                    ariaLabel={`RAM Usage Chart. Current usage is ${currentRamUsage.toFixed(0)} percent. ${ramThreshold ? `Monitoring threshold set at ${ramThreshold} percent.` : 'No threshold set.'}`}
                    currentValue={currentRamUsage}
                />
            </div>

            {/* Footer Section */}
            <footer className="mt-8 text-center text-slate-500 text-xs sm:text-sm border-t border-slate-700 pt-4">
                <p>&copy; {new Date().getFullYear()} Citibank Demo Business Inc. All rights reserved.</p>
                <p>All data presented is simulated for demonstration purposes only and does not reflect actual system performance.</p>
            </footer>
        </div>
    );
});