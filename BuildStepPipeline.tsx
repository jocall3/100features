// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChartBarIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '../icons/FeatureIcons.tsx'; // Assuming these icons exist or will be provided. Added CheckCircleIcon, XCircleIcon, ClockIcon.

/**
 * @typedef {('pending' | 'running' | 'success' | 'failure' | 'skipped')} StepStatus
 * @description Defines the possible statuses for a build pipeline step.
 */
export type StepStatus = 'pending' | 'running' | 'success' | 'failure' | 'skipped';

/**
 * @interface PipelineStep
 * @description Represents a single step in the CI/CD build pipeline.
 * Contains metadata, status, timing information, and logs for the step.
 */
export interface PipelineStep {
    name: string;
    status: StepStatus;
    durationMs?: number; // Duration in milliseconds
    startTime?: number; // Timestamp when step started (ms since epoch)
    endTime?: number;   // Timestamp when step ended (ms since epoch)
    logs: string[];     // Log messages generated during the step
}

/**
 * @interface PipelineSummary
 * @description Provides a comprehensive summary of the entire pipeline run,
 * including counts for different step outcomes, total duration, and overall status.
 */
export interface PipelineSummary {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    skippedSteps: number;
    totalDurationMs: number;
    runCount: number;
    lastRunTime?: number; // Timestamp of the last run completion
    overallStatus: StepStatus; // The aggregate status of the entire pipeline run
}

// Default list of steps for the pipeline simulation
const initialStepNames: string[] = [
    'Initialize Environment',
    'Fetch Dependencies',
    'Build Source Code',
    'Run Unit Tests',
    'Perform Linting',
    'Run Integration Tests',
    'Containerize App',
    'Deploy to Staging',
    'Run E2E Tests',
    'Release to Production'
];

/**
 * @function generateRandomLog
 * @description Generates a context-specific log message for a pipeline step.
 * @param {string} stepName - The name of the step.
 * @param {StepStatus} status - The status of the step.
 * @returns {string} A dynamically generated log message.
 */
export const generateRandomLog = (stepName: string, status: StepStatus): string => {
    const timestamp = new Date().toISOString();
    switch (status) {
        case 'running': return `[${timestamp}] INFO: Starting ${stepName}...`;
        case 'success': return `[${timestamp}] SUCCESS: ${stepName} completed successfully.`;
        case 'failure': return `[${timestamp}] ERROR: ${stepName} failed. Review logs for specific issues.`;
        case 'skipped': return `[${timestamp}] WARNING: ${stepName} was skipped due to a preceding step failure.`;
        default: return `[${timestamp}] DEBUG: ${stepName} is awaiting execution.`;
    }
};

/**
 * @function simulateStepExecution
 * @description Simulates the execution of a single pipeline step with a random duration and outcome.
 * This function is asynchronous to mimic real-world processing times.
 * @param {string} stepName - The name of the step being simulated.
 * @param {number} minDuration - Minimum duration for the step in milliseconds.
 * @param {number} maxDuration - Maximum duration for the step in milliseconds.
 * @param {number} failureRate - Probability of failure for this step (0.0 to 1.0).
 * @returns {Promise<{ success: boolean; duration: number; logs: string[] }>} A promise that resolves with the step's outcome, duration, and generated logs.
 */
export const simulateStepExecution = (
    stepName: string,
    minDuration: number = 500,
    maxDuration: number = 3000,
    failureRate: number = 0.2
): Promise<{ success: boolean; duration: number; logs: string[] }> => {
    return new Promise(resolve => {
        const duration = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;
        const willFail = Math.random() < failureRate;
        const logs: string[] = [];

        logs.push(generateRandomLog(stepName, 'running')); // Initial log for starting

        setTimeout(() => {
            if (willFail) {
                logs.push(generateRandomLog(stepName, 'failure'));
                logs.push(`[${new Date().toISOString()}] ERROR: Detailed report for ${stepName}: encountered unexpected build errors. (Simulated)`);
                resolve({ success: false, duration, logs });
            } else {
                logs.push(generateRandomLog(stepName, 'success'));
                if (Math.random() > 0.7) { // Sometimes add more specific success logs
                    logs.push(`[${new Date().toISOString()}] INFO: All sub-tasks for ${stepName} completed.`);
                }
                resolve({ success: true, duration, logs });
            }
        }, duration);
    });
};

/**
 * @function BuildStepPipeline
 * @description A comprehensive React component that simulates and visualizes a CI/CD build pipeline.
 * It features step-by-step execution, dynamic status updates, random success/failure scenarios,
 * detailed step duration tracking, an overall pipeline progress bar, and a summary of the run.
 * Users can rerun the pipeline or reset it, and view detailed logs for each step.
 * This component is designed for high maintainability and provides a realistic simulation experience.
 */
export const BuildStepPipeline: React.FC = () => {
    // Memoized initial state for pipeline steps to prevent re-creation on re-renders
    const initialPipelineSteps: PipelineStep[] = useMemo(() =>
        initialStepNames.map(name => ({ name, status: 'pending', logs: [] })), []
    );

    // Memoized initial state for pipeline summary
    const initialPipelineSummary: PipelineSummary = useMemo(() => ({
        totalSteps: initialStepNames.length,
        successfulSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        totalDurationMs: 0,
        runCount: 0,
        overallStatus: 'pending',
    }), []);

    const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(initialPipelineSteps);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary>(initialPipelineSummary);
    const [overallProgress, setOverallProgress] = useState<number>(0); // 0-100%
    const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null); // Index of the step whose logs are currently displayed

    /**
     * @function getStepStatusColor
     * @description Returns Tailwind CSS classes for a given step status, dictating its visual style.
     * @param {StepStatus} status - The status of the pipeline step.
     * @returns {string} A string containing concatenated Tailwind CSS classes.
     */
    const getStepStatusColor = useCallback((status: StepStatus): string => {
        switch (status) {
            case 'success': return 'border-green-500 bg-green-500/10 text-green-300';
            case 'failure': return 'border-red-500 bg-red-500/10 text-red-300';
            case 'running': return 'border-cyan-500 bg-cyan-500/10 text-cyan-300 animate-pulse';
            case 'skipped': return 'border-yellow-500 bg-yellow-500/10 text-yellow-300';
            default: return 'border-slate-600 bg-slate-800/20 text-slate-400';
        }
    }, []);

    /**
     * @function resetPipeline
     * @description Resets the pipeline to its initial pending state, clearing all previous run data.
     */
    const resetPipeline = useCallback(() => {
        setPipelineSteps(initialPipelineSteps);
        setPipelineSummary(initialPipelineSummary);
        setOverallProgress(0);
        setIsRunning(false);
        setSelectedStepIndex(null);
    }, [initialPipelineSteps, initialPipelineSummary]);

    /**
     * @function runPipeline
     * @description Initiates the full pipeline execution, simulating each step sequentially.
     * It manages step statuses, durations, and logs, and calculates the overall pipeline summary.
     * If a step fails, subsequent steps are marked as 'skipped'.
     */
    const runPipeline = useCallback(async () => {
        if (isRunning) return; // Prevent multiple concurrent runs

        // Reset state for a new run
        setIsRunning(true);
        setSelectedStepIndex(null);
        setPipelineSteps(initialPipelineSteps.map(step => ({
            ...step,
            status: 'pending',
            durationMs: undefined,
            startTime: undefined,
            endTime: undefined,
            logs: []
        })));
        setOverallProgress(0);

        const currentRunStartTime = Date.now();
        let successfulCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        let pipelineFailed = false; // Flag to stop subsequent steps
        let totalSimulatedDuration = 0; // Accumulated duration from simulated steps

        // Create a mutable copy of steps for updates during the loop
        const updatedSteps: PipelineStep[] = [...initialPipelineSteps];

        for (let i = 0; i < initialStepNames.length; i++) {
            const currentStepName = initialStepNames[i];
            const stepStartTime = Date.now();

            if (pipelineFailed) {
                // If a previous step failed, mark current and subsequent steps as skipped
                updatedSteps[i] = {
                    ...updatedSteps[i],
                    status: 'skipped',
                    startTime: stepStartTime,
                    endTime: stepStartTime,
                    durationMs: 0,
                    logs: [generateRandomLog(currentStepName, 'skipped')]
                };
                skippedCount++;
            } else {
                // Mark current step as running
                updatedSteps[i] = {
                    ...updatedSteps[i],
                    status: 'running',
                    startTime: stepStartTime,
                    logs: [generateRandomLog(currentStepName, 'running')]
                };
            }
            // Update UI with current step's status immediately
            setPipelineSteps([...updatedSteps]);

            // Update overall progress (based on steps *started*)
            setOverallProgress(Math.floor(((i + 1) / initialStepNames.length) * 100));

            if (!pipelineFailed) {
                // Simulate step execution only if the pipeline hasn't failed yet
                try {
                    const { success, duration, logs } = await simulateStepExecution(currentStepName, 700, 3000, 0.3); // Configurable failure rate
                    const stepEndTime = Date.now();

                    updatedSteps[i] = {
                        ...updatedSteps[i],
                        status: success ? 'success' : 'failure',
                        endTime: stepEndTime,
                        durationMs: duration,
                        logs: [...updatedSteps[i].logs, ...logs] // Append new logs
                    };
                    totalSimulatedDuration += duration; // Accumulate simulated duration

                    if (success) {
                        successfulCount++;
                    } else {
                        failedCount++;
                        pipelineFailed = true; // Mark pipeline as failed
                    }
                } catch (error) {
                    console.error(`Error during step ${currentStepName}:`, error);
                    const stepEndTime = Date.now();
                    updatedSteps[i] = {
                        ...updatedSteps[i],
                        status: 'failure',
                        endTime: stepEndTime,
                        durationMs: 0, // Or some default for error duration
                        logs: [...updatedSteps[i].logs, generateRandomLog(currentStepName, 'failure'), `[${new Date().toISOString()}] CRITICAL: Unexpected runtime error: ${error instanceof Error ? error.message : String(error)}`]
                    };
                    failedCount++;
                    pipelineFailed = true;
                }
            }
            setPipelineSteps([...updatedSteps]); // Final update for the current step
        }

        const currentRunEndTime = Date.now();
        const actualTotalDuration = currentRunEndTime - currentRunStartTime;

        // Determine overall pipeline status
        let finalOverallStatus: StepStatus = 'pending'; // Default
        if (failedCount > 0) {
            finalOverallStatus = 'failure';
        } else if (successfulCount === initialStepNames.length) {
            finalOverallStatus = 'success';
        } else if (skippedCount > 0 && failedCount === 0) {
            // This case implies some steps were skipped, but no 'active' failure occurred
            // This might represent a partial success or specific scenario. For this simulation,
            // if no direct failures, and some steps were skipped due to *prior* failures,
            // it still indicates a failure of the overall sequence.
            // If skipped due to *conditional logic* and not failure, the pipeline might still be success.
            // For simplicity in this simulation, if any were skipped due to failure, it's a failure.
            finalOverallStatus = 'failure';
        }


        setPipelineSummary(prevSummary => ({
            ...prevSummary,
            successfulSteps: successfulCount,
            failedSteps: failedCount,
            skippedSteps: skippedCount,
            totalDurationMs: actualTotalDuration, // Use actual elapsed time for summary
            runCount: prevSummary.runCount + 1,
            lastRunTime: currentRunEndTime,
            overallStatus: finalOverallStatus,
        }));
        setIsRunning(false);
        setOverallProgress(100); // Ensure progress bar is full at the end
    }, [isRunning, initialPipelineSteps, initialStepNames, generateRandomLog]); // Dependencies for useCallback

    // Effect hook to run the pipeline automatically on initial mount
    useEffect(() => {
        // Run pipeline only if it hasn't run yet and is not currently running
        if (pipelineSummary.runCount === 0 && !isRunning) {
            runPipeline();
        }
    }, [runPipeline, pipelineSummary.runCount, isRunning]);

    // Memoized logs for the currently selected step to optimize re-renders
    const currentStepLogs = useMemo(() => {
        if (selectedStepIndex !== null && pipelineSteps[selectedStepIndex]) {
            return pipelineSteps[selectedStepIndex].logs;
        }
        return [];
    }, [selectedStepIndex, pipelineSteps]);

    /**
     * @function StatusIcon
     * @description A small component to render an appropriate icon based on the step's status.
     * @param {{ status: StepStatus }} props - The props object containing the status.
     * @returns {JSX.Element | null} An icon component or null if no icon is specified for the status.
     */
    const StatusIcon = useCallback(({ status }: { status: StepStatus }) => {
        const iconClasses = "w-5 h-5";
        switch (status) {
            case 'success': return <CheckCircleIcon className={`text-green-500 ${iconClasses}`} />;
            case 'failure': return <XCircleIcon className={`text-red-500 ${iconClasses}`} />;
            case 'running': return <ClockIcon className={`text-cyan-500 animate-spin ${iconClasses}`} />;
            case 'skipped': return <ClockIcon className={`text-yellow-500 ${iconClasses}`} />; // Using ClockIcon for skipped, could be different.
            default: return null;
        }
    }, []);

    return (
        <div className="h-full min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100 font-sans antialiased">
            {/* Accessibility: Live region for announcing pipeline status changes for screen readers */}
            <div className="sr-only" role="status" aria-live="polite">
                {isRunning ? "Pipeline is running." : pipelineSummary.overallStatus === 'success' ? "Pipeline completed successfully." : pipelineSummary.overallStatus === 'failure' ? "Pipeline failed." : "Pipeline is idle."}
            </div>

            {/* Header Section */}
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-center bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-700">
                <div className="mb-4 sm:mb-0 text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center justify-center sm:justify-start">
                        <ChartBarIcon className="w-8 h-8 mr-3 text-cyan-400" aria-hidden="true" />
                        <span className="leading-tight">CI/CD Pipeline Simulator</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm max-w-md">Real-time visualization of a simulated enterprise CI/CD pipeline, showcasing build, test, and deploy stages with dynamic outcomes.</p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <button
                        onClick={runPipeline}
                        disabled={isRunning}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                        aria-label={isRunning ? 'Pipeline is running, cannot rerun' : 'Rerun pipeline simulation'}
                    >
                        {isRunning ? (
                            <span className="flex items-center justify-center">
                                <ClockIcon className="animate-spin -ml-1 mr-2 h-5 w-5" aria-hidden="true" /> Running...
                            </span>
                        ) : 'Rerun Pipeline'}
                    </button>
                    <button
                        onClick={resetPipeline}
                        disabled={isRunning}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                        aria-label="Reset pipeline to its initial pending state"
                    >
                        Reset
                    </button>
                </div>
            </header>

            {/* Overall Pipeline Progress Bar */}
            <div className="w-full bg-slate-700 rounded-full h-3 mb-8 overflow-hidden" role="progressbar" aria-valuenow={overallProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Overall pipeline progress">
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out
                        ${pipelineSummary.overallStatus === 'failure' ? 'bg-red-500' :
                        pipelineSummary.overallStatus === 'success' ? 'bg-green-500' :
                        'bg-cyan-500'
                    }`}
                    style={{ width: `${overallProgress}%` }}
                ></div>
            </div>

            {/* Pipeline Steps Visualization */}
            <div className="flex-grow flex items-center justify-center min-h-0 py-4 px-2 overflow-x-auto">
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 flex-nowrap md:flex-wrap pb-2">
                    {pipelineSteps.map((step, i) => (
                        <React.Fragment key={step.name}>
                            <button
                                onClick={() => setSelectedStepIndex(i)}
                                className={`flex-shrink-0 p-4 rounded-xl border-2 w-40 sm:w-48 h-28 flex flex-col items-center justify-center font-bold text-center relative
                                            ${getStepStatusColor(step.status)}
                                            ${selectedStepIndex === i ? 'ring-2 ring-offset-2 ring-cyan-400 ring-offset-slate-900' : ''}
                                            transition-all duration-200 ease-in-out hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
                                            `}
                                aria-label={`View details for ${step.name} step, current status: ${step.status}`}
                                role="button"
                            >
                                <span className="text-base sm:text-lg mb-1">{step.name}</span>
                                <div className="flex items-center text-sm sm:text-base">
                                    <StatusIcon status={step.status} />
                                    <span className="ml-2 capitalize">{step.status}</span>
                                </div>
                                {step.durationMs !== undefined && step.status !== 'pending' && step.status !== 'running' && (
                                    <span className="text-xs text-slate-400 mt-1">({(step.durationMs / 1000).toFixed(1)}s)</span>
                                )}
                            </button>
                            {i < pipelineSteps.length - 1 && (
                                <div className={`flex-shrink-0 h-1 w-10 sm:w-16 rounded-full transition-all duration-500
                                                ${step.status === 'success' ? 'bg-green-500' :
                                                  step.status === 'failure' ? 'bg-red-500' :
                                                  step.status === 'running' && pipelineSteps[i+1].status === 'pending' ? 'bg-cyan-500' :
                                                  'bg-slate-600'
                                                }`}
                                    role="separator"
                                    aria-orientation="horizontal"
                                    aria-label="Pipeline connection line"
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Pipeline Summary and Log Viewer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Pipeline Summary Card */}
                <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center">
                        <ChartBarIcon className="w-6 h-6 mr-2 text-blue-400" aria-hidden="true" />
                        Pipeline Run Summary
                    </h2>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-300 text-sm sm:text-base">
                        <dt className="font-medium">Total Runs:</dt>
                        <dd className="font-semibold">{pipelineSummary.runCount}</dd>

                        <dt className="font-medium">Overall Status:</dt>
                        <dd className={`capitalize font-semibold flex items-center ${getStepStatusColor(pipelineSummary.overallStatus).split(' ').find(cls => cls.startsWith('text-'))}`}>
                            <StatusIcon status={pipelineSummary.overallStatus} />
                            <span className="ml-2">{pipelineSummary.overallStatus}</span>
                        </dd>

                        <dt className="font-medium">Total Duration:</dt>
                        <dd>{(pipelineSummary.totalDurationMs / 1000).toFixed(2)}s</dd>

                        <dt className="font-medium">Successful Steps:</dt>
                        <dd className="text-green-400 font-semibold">{pipelineSummary.successfulSteps}</dd>

                        <dt className="font-medium">Failed Steps:</dt>
                        <dd className="text-red-400 font-semibold">{pipelineSummary.failedSteps}</dd>

                        <dt className="font-medium">Skipped Steps:</dt>
                        <dd className="text-yellow-400 font-semibold">{pipelineSummary.skippedSteps}</dd>

                        {pipelineSummary.lastRunTime && (
                            <>
                                <dt className="font-medium">Last Run At:</dt>
                                <dd className="text-xs sm:text-sm">{new Date(pipelineSummary.lastRunTime).toLocaleString()}</dd>
                            </>
                        )}
                    </dl>
                </div>

                {/* Step Log Viewer Card */}
                <div className="bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col border border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center">
                        <ClockIcon className="w-6 h-6 mr-2 text-purple-400" aria-hidden="true" />
                        Step Logs: {selectedStepIndex !== null ? pipelineSteps[selectedStepIndex].name : 'Select a step'}
                    </h2>
                    <div
                        className="flex-grow bg-slate-900 rounded-lg p-3 overflow-y-auto text-xs sm:text-sm font-mono text-slate-300 max-h-64 lg:max-h-full min-h-[100px] border border-slate-700"
                        role="log"
                        aria-label={selectedStepIndex !== null ? `Logs for ${pipelineSteps[selectedStepIndex].name}` : "No step selected for logs"}
                    >
                        {selectedStepIndex === null ? (
                            <p className="text-slate-500">Click on any pipeline step above to view its detailed execution logs.</p>
                        ) : currentStepLogs.length === 0 ? (
                            <p className="text-slate-500">No logs available for this step yet, or step is pending.</p>
                        ) : (
                            currentStepLogs.map((log, index) => (
                                <p key={index} className="mb-1 last:mb-0 whitespace-pre-wrap">{log}</p>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};