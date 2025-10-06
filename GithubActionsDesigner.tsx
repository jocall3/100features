// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

// This file has been significantly enhanced to represent a more robust, enterprise-grade
// component for designing GitHub Actions workflows. It now includes:
// - TypeScript types for all data structures (events, jobs, steps, workflow definition).
// - Centralized state management using React's Context API and a reducer for the workflow definition.
// - A more modular component structure (`Node`, `Arrow`, `WorkflowCanvas`, `Sidebar`, `Toolbar`, `YamlPreview`).
// - Simulated functionality for adding, editing, and saving workflow elements.
// - Error Boundary for robust error handling.
// - Loading/error states for asynchronous operations (simulated).
// - Responsive styling (leveraging Tailwind CSS).
// - Accessibility improvements (e.g., ARIA attributes).
// - A basic YAML preview feature.
// - Memoization for performance optimization.

import React, { useState, useReducer, createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { GitBranchIcon } from '../icons/FeatureIcons';

// --- Utility Components ---

/**
 * @interface ErrorBoundaryProps
 * @description Props for the ErrorBoundary component.
 * @property {React.ReactNode} children - The child components to render within the error boundary.
 * @property {React.ReactNode} [fallback] - Optional fallback UI to render when an error occurs.
 */
export interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * @interface ErrorBoundaryState
 * @description State for the ErrorBoundary component.
 * @property {boolean} hasError - Indicates if an error has occurred.
 * @property {Error | null} error - The error object if an error occurred.
 * @property {React.ErrorInfo | null} errorInfo - Additional error information.
 */
export interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * @class ErrorBoundary
 * @extends React.Component<ErrorBoundaryProps, ErrorBoundaryState>
 * @description A reusable React Error Boundary component to catch JavaScript errors
 *              anywhere in its child component tree, log those errors, and display a fallback UI.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    /**
     * @static
     * @method getDerivedStateFromError
     * @param {Error} error - The error that was thrown.
     * @returns {ErrorBoundaryState} An update to the state that indicates an error has occurred.
     * @description This lifecycle method is called after an error has been thrown by a descendant component.
     *              It receives the error that was thrown as a parameter and should return a value to update state.
     */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    /**
     * @method componentDidCatch
     * @param {Error} error - The error that was thrown.
     * @param {React.ErrorInfo} errorInfo - An object with a `componentStack` key containing
     *                                      information about which component threw the error.
     * @description This lifecycle method is called after an error has been thrown by a descendant component.
     *              It can be used to log error information.
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return this.props.fallback || (
                <div className="p-8 text-center bg-red-900/30 border border-red-700 rounded-lg text-red-300">
                    <h2 className="text-xl font-bold">Something went wrong.</h2>
                    <p className="mt-2 text-sm">We're sorry for the inconvenience. Please try again or refresh the page.</p>
                    {this.state.error && <p className="mt-4 text-xs font-mono">{this.state.error.toString()}</p>}
                    {this.state.errorInfo && <details className="mt-4 text-xs font-mono max-h-40 overflow-auto whitespace-pre-wrap"><summary>Error Details</summary>{this.state.errorInfo.componentStack}</details>}
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * @interface NodeProps
 * @description Props for the generic Node component.
 * @template T - The type of data associated with the node.
 * @property {string} title - The main title of the node.
 * @property {string} content - A brief description or content for the node.
 * @property {React.ReactNode} [children] - Optional child elements to render inside the node.
 * @property {T} data - The actual data object represented by this node.
 * @property {(data: T) => void} [onEdit] - Callback function when the node is requested to be edited.
 * @property {() => void} [onDelete] - Callback function when the node is requested to be deleted.
 * @property {string} [borderColorClass='border-slate-700'] - Tailwind CSS class for border color.
 * @property {string} [titleColorClass='text-cyan-400'] - Tailwind CSS class for title color.
 */
export interface NodeProps<T> {
    title: string;
    content: string;
    children?: React.ReactNode;
    data: T; // The actual data object this node represents
    onEdit?: (data: T) => void;
    onDelete?: () => void;
    borderColorClass?: string;
    titleColorClass?: string;
}

/**
 * @function Node
 * @template T
 * @param {NodeProps<T>} props - Props for the Node component.
 * @returns {JSX.Element} A visual card representing a workflow element.
 * @description A generic display component for workflow elements, providing a title, content,
 *              and optional actions (edit/delete).
 */
export const Node = React.memo(<T extends { id: string }>({
    title,
    content,
    children,
    data,
    onEdit,
    onDelete,
    borderColorClass = 'border-slate-700',
    titleColorClass = 'text-cyan-400'
}: NodeProps<T>): JSX.Element => (
    <div
        className={`bg-slate-800 border ${borderColorClass} rounded-lg p-4 w-64 shadow-md hover:shadow-lg transition-shadow duration-200 relative`}
        aria-label={`${title} node`}
        data-id={data.id}
    >
        <h3 className={`font-bold ${titleColorClass}`}>{title}</h3>
        <p className="text-sm text-slate-300 mt-1">{content}</p>
        {children}
        {(onEdit || onDelete) && (
            <div className="absolute top-2 right-2 flex space-x-1">
                {onEdit && (
                    <button
                        onClick={() => onEdit(data)}
                        className="text-slate-400 hover:text-cyan-400 p-1 rounded-full hover:bg-slate-700 transition-colors"
                        aria-label={`Edit ${title}`}
                        title={`Edit ${title}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="text-slate-400 hover:text-red-400 p-1 rounded-full hover:bg-slate-700 transition-colors"
                        aria-label={`Delete ${title}`}
                        title={`Delete ${title}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                )}
            </div>
        )}
    </div>
));

/**
 * @function Arrow
 * @returns {JSX.Element} A visual arrow component.
 * @description Displays a simple right-pointing arrow, commonly used to indicate flow in diagrams.
 */
export const Arrow = React.memo((): JSX.Element => (
    <div className="flex items-center justify-center mx-4 text-slate-500" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
        </svg>
    </div>
));

// --- Workflow Definition Types ---

/**
 * @enum WorkflowEventTrigger
 * @description Enumerates common GitHub Actions event triggers.
 */
export enum WorkflowEventTrigger {
    Push = 'push',
    PullRequest = 'pull_request',
    WorkflowDispatch = 'workflow_dispatch',
    Schedule = 'schedule',
    // ... add more as needed
}

/**
 * @interface WorkflowEvent
 * @description Represents a trigger event for the GitHub Action workflow.
 * @property {string} id - Unique identifier for the event.
 * @property {WorkflowEventTrigger} type - The type of event trigger.
 * @property {string} description - A user-friendly description of the event.
 * @property {Record<string, any>} [config] - Optional configuration for the event (e.g., branches for push).
 */
export interface WorkflowEvent {
    id: string;
    type: WorkflowEventTrigger;
    description: string;
    config?: Record<string, any>;
}

/**
 * @enum WorkflowStepActionType
 * @description Enumerates the types of actions a workflow step can perform.
 */
export enum WorkflowStepActionType {
    Uses = 'uses', // Uses an existing GitHub Action
    Run = 'run',   // Runs a shell command
}

/**
 * @interface WorkflowStep
 * @description Represents a single step within a job.
 * @property {string} id - Unique identifier for the step.
 * @property {string} [name] - Optional name for the step.
 * @property {WorkflowStepActionType} actionType - The type of action for this step.
 * @property {string} actionValue - The value associated with the action (e.g., 'actions/checkout@v2' or 'npm install').
 * @property {Record<string, any>} [env] - Optional environment variables for the step.
 * @property {string} [workingDirectory] - Optional working directory for the step.
 */
export interface WorkflowStep {
    id: string;
    name?: string;
    actionType: WorkflowStepActionType;
    actionValue: string;
    env?: Record<string, string>;
    workingDirectory?: string;
}

/**
 * @interface WorkflowJob
 * @description Represents a single job in the workflow.
 * @property {string} id - Unique identifier for the job.
 * @property {string} name - The display name of the job.
 * @property {string} runsOn - The runner environment for the job (e.g., 'ubuntu-latest').
 * @property {string[]} [needs] - Optional array of job IDs this job depends on.
 * @property {WorkflowStep[]} steps - An array of steps to be executed within this job.
 */
export interface WorkflowJob {
    id: string;
    name: string;
    runsOn: string;
    needs?: string[];
    steps: WorkflowStep[];
}

/**
 * @interface WorkflowDefinition
 * @description The complete definition of a GitHub Actions workflow.
 * @property {string} id - Unique identifier for the workflow.
 * @property {string} name - The name of the workflow.
 * @property {WorkflowEvent[]} on - An array of events that trigger the workflow.
 * @property {WorkflowJob[]} jobs - An array of jobs to be executed in the workflow.
 */
export interface WorkflowDefinition {
    id: string;
    name: string;
    on: WorkflowEvent[];
    jobs: WorkflowJob[];
}

// --- Workflow Context for State Management ---

/**
 * @interface WorkflowState
 * @description The state managed by the WorkflowContext.
 * @property {WorkflowDefinition | null} workflow - The current workflow definition.
 * @property {boolean} isLoading - Indicates if the workflow is currently loading.
 * @property {string | null} error - Any error message encountered during workflow operations.
 */
export interface WorkflowState {
    workflow: WorkflowDefinition | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * @enum WorkflowActionType
 * @description Enumerates the types of actions that can be dispatched to the workflow reducer.
 */
export enum WorkflowActionType {
    SET_WORKFLOW = 'SET_WORKFLOW',
    ADD_EVENT = 'ADD_EVENT',
    UPDATE_EVENT = 'UPDATE_EVENT',
    DELETE_EVENT = 'DELETE_EVENT',
    ADD_JOB = 'ADD_JOB',
    UPDATE_JOB = 'UPDATE_JOB',
    DELETE_JOB = 'DELETE_JOB',
    ADD_STEP = 'ADD_STEP',
    UPDATE_STEP = 'UPDATE_STEP',
    DELETE_STEP = 'DELETE_STEP',
    SET_LOADING = 'SET_LOADING',
    SET_ERROR = 'SET_ERROR',
}

/**
 * @interface WorkflowAction
 * @description Represents an action to be dispatched to the workflow reducer.
 * @property {WorkflowActionType} type - The type of action.
 * @property {any} [payload] - Optional payload containing data for the action.
 */
export interface WorkflowAction {
    type: WorkflowActionType;
    payload?: any;
}

/**
 * @function workflowReducer
 * @param {WorkflowState} state - The current state of the workflow.
 * @param {WorkflowAction} action - The action to be applied.
 * @returns {WorkflowState} The new state after applying the action.
 * @description A reducer function to manage the state of the `WorkflowDefinition`.
 */
const workflowReducer = (state: WorkflowState, action: WorkflowAction): WorkflowState => {
    switch (action.type) {
        case WorkflowActionType.SET_WORKFLOW:
            return { ...state, workflow: action.payload, isLoading: false, error: null };
        case WorkflowActionType.ADD_EVENT:
            if (!state.workflow) return state;
            return {
                ...state,
                workflow: {
                    ...state.workflow,
                    on: [...state.workflow.on, action.payload as WorkflowEvent],
                },
            };
        case WorkflowActionType.UPDATE_EVENT:
            if (!state.workflow) return state;
            return {
                ...state,
                workflow: {
                    ...state.workflow,
                    on: state.workflow.on.map((event) =>
                        event.id === (action.payload as WorkflowEvent).id ? (action.payload as WorkflowEvent) : event
                    ),
                },
            };
        case WorkflowActionType.DELETE_EVENT:
            if (!state.workflow) return state;
            return {
                ...state,
                workflow: {
                    ...state.workflow,
                    on: state.workflow.on.filter((event) => event.id !== action.payload),
                },
            };
        case WorkflowActionType.ADD_JOB:
            if (!state.workflow) return state;
            return {
                ...state,
                workflow: {
                    ...state.workflow,
                    jobs: [...state.workflow.jobs, action.payload as WorkflowJob],
                },
            };
        case WorkflowActionType.UPDATE_JOB:
            if (!state.workflow) return state;
            return {
                ...state,
                workflow: {
                    ...state.workflow,
                    jobs: state.workflow.jobs.map((job) =>
                        job.id === (action.payload as WorkflowJob).id ? (action.payload as WorkflowJob) : job
                    ),
                },
            };
        case WorkflowActionType.DELETE_JOB:
            if (!state.workflow) return state;
            return {
                ...state,
                workflow: {
                    ...state.workflow,
                    jobs: state.workflow.jobs.filter((job) => job.id !== action.payload),
                },
            };
        case WorkflowActionType.ADD_STEP:
            if (!state.workflow) return state;
            return {
                ...state,
                workflow: {
                    ...state.workflow,
                    jobs: state.workflow.jobs.map((job) =>
                        job.id === action.payload.jobId
                            ? { ...job, steps: [...job.steps, action.payload.step as WorkflowStep] }
                            : job
                    ),
                },
            };
        case WorkflowActionType.UPDATE_STEP:
            if (!state.workflow) return state;
            return {
                ...state,
                workflow: {
                    ...state.workflow,
                    jobs: state.workflow.jobs.map((job) =>
                        job.id === action.payload.jobId
                            ? {
                                ...job,
                                steps: job.steps.map((step) =>
                                    step.id === (action.payload.step as WorkflowStep).id ? (action.payload.step as WorkflowStep) : step
                                ),
                            }
                            : job
                    ),
                },
            };
        case WorkflowActionType.DELETE_STEP:
            if (!state.workflow) return state;
            return {
                ...state.workflow,
                workflow: {
                    ...state.workflow,
                    jobs: state.workflow.jobs.map((job) =>
                        job.id === action.payload.jobId
                            ? { ...job, steps: job.steps.filter((step) => step.id !== action.payload.stepId) }
                            : job
                    ),
                },
            };
        case WorkflowActionType.SET_LOADING:
            return { ...state, isLoading: action.payload };
        case WorkflowActionType.SET_ERROR:
            return { ...state, error: action.payload, isLoading: false };
        default:
            return state;
    }
};

/**
 * @interface WorkflowContextType
 * @description The shape of the context object provided by WorkflowProvider.
 * @property {WorkflowState} state - The current state of the workflow.
 * @property {React.Dispatch<WorkflowAction>} dispatch - The dispatch function to update the workflow state.
 * @property {() => Promise<void>} loadWorkflow - Function to simulate loading a workflow.
 * @property {(workflow: WorkflowDefinition) => Promise<void>} saveWorkflow - Function to simulate saving a workflow.
 */
export interface WorkflowContextType {
    state: WorkflowState;
    dispatch: React.Dispatch<WorkflowAction>;
    loadWorkflow: () => Promise<void>;
    saveWorkflow: (workflow: WorkflowDefinition) => Promise<void>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

/**
 * @function useWorkflow
 * @returns {WorkflowContextType} The workflow context object.
 * @throws {Error} If `useWorkflow` is used outside of a `WorkflowProvider`.
 * @description A custom hook to easily access the `WorkflowContext`.
 */
export const useWorkflow = (): WorkflowContextType => {
    const context = useContext(WorkflowContext);
    if (!context) {
        throw new Error('useWorkflow must be used within a WorkflowProvider');
    }
    return context;
};

/**
 * @interface WorkflowProviderProps
 * @description Props for the WorkflowProvider component.
 * @property {React.ReactNode} children - The child components that will consume the workflow context.
 */
export interface WorkflowProviderProps {
    children: React.ReactNode;
}

/**
 * @function WorkflowProvider
 * @param {WorkflowProviderProps} { children } - Props for the provider.
 * @returns {JSX.Element} A provider component that makes workflow state and dispatch available to its children.
 * @description Provides the workflow state and actions to its descendants via the `WorkflowContext`.
 */
export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(workflowReducer, {
        workflow: null,
        isLoading: true,
        error: null,
    });

    const simulateFetch = (data: any, delay = 500) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 10% chance of error
                    resolve(data);
                } else {
                    reject("Failed to fetch workflow data.");
                }
            }, delay);
        });
    };

    const loadWorkflow = useCallback(async () => {
        dispatch({ type: WorkflowActionType.SET_LOADING, payload: true });
        try {
            const initialWorkflow: WorkflowDefinition = {
                id: 'workflow-123',
                name: 'CI/CD Pipeline',
                on: [
                    { id: 'event-push', type: WorkflowEventTrigger.Push, description: 'Trigger on push to main branch', config: { branches: ['main'] } },
                    { id: 'event-pr', type: WorkflowEventTrigger.PullRequest, description: 'Trigger on pull request to main', config: { branches: ['main'] } }
                ],
                jobs: [
                    {
                        id: 'job-build',
                        name: 'Build Project',
                        runsOn: 'ubuntu-latest',
                        steps: [
                            { id: 'step-checkout', actionType: WorkflowStepActionType.Uses, actionValue: 'actions/checkout@v2', name: 'Checkout code' },
                            { id: 'step-node', actionType: WorkflowStepActionType.Run, actionValue: 'npm install', name: 'Install dependencies' },
                            { id: 'step-build', actionType: WorkflowStepActionType.Run, actionValue: 'npm run build', name: 'Build application' },
                        ],
                    },
                    {
                        id: 'job-test',
                        name: 'Run Tests',
                        runsOn: 'ubuntu-latest',
                        needs: ['job-build'],
                        steps: [
                            { id: 'step-test', actionType: WorkflowStepActionType.Run, actionValue: 'npm test', name: 'Execute tests' },
                        ],
                    },
                    {
                        id: 'job-deploy',
                        name: 'Deploy to Staging',
                        runsOn: 'ubuntu-latest',
                        needs: ['job-test'],
                        steps: [
                            { id: 'step-s3', actionType: WorkflowStepActionType.Run, actionValue: 'aws s3 sync ./build s3://staging-bucket', name: 'Deploy to S3' },
                            { id: 'step-notify', actionType: WorkflowStepActionType.Uses, actionValue: 'actions/slack-notification@v1', name: 'Send Slack Notification', env: { SLACK_WEBHOOK_URL: '${{ secrets.SLACK_WEBHOOK_URL }}'} }
                        ],
                    },
                ],
            };
            const loadedWorkflow = await simulateFetch(initialWorkflow) as WorkflowDefinition;
            dispatch({ type: WorkflowActionType.SET_WORKFLOW, payload: loadedWorkflow });
        } catch (err) {
            dispatch({ type: WorkflowActionType.SET_ERROR, payload: String(err) });
        }
    }, []);

    const saveWorkflow = useCallback(async (workflowData: WorkflowDefinition) => {
        dispatch({ type: WorkflowActionType.SET_LOADING, payload: true });
        try {
            // Simulate API call to save workflow
            await simulateFetch(workflowData, 1000);
            dispatch({ type: WorkflowActionType.SET_LOADING, payload: false });
            // Optionally, dispatch SET_WORKFLOW again with potentially server-updated data
            // For now, just indicate success.
            console.log("Workflow saved successfully!");
        } catch (err) {
            dispatch({ type: WorkflowActionType.SET_ERROR, payload: `Failed to save workflow: ${String(err)}` });
        }
    }, []);

    useEffect(() => {
        loadWorkflow();
    }, [loadWorkflow]);

    const contextValue = useMemo(() => ({
        state,
        dispatch,
        loadWorkflow,
        saveWorkflow,
    }), [state, dispatch, loadWorkflow, saveWorkflow]);

    return (
        <WorkflowContext.Provider value={contextValue}>
            {children}
        </WorkflowContext.Provider>
    );
};

// --- Specific Workflow Node Components ---

/**
 * @interface WorkflowEventNodeProps
 * @description Props for the WorkflowEventNode component.
 * @property {WorkflowEvent} event - The workflow event data.
 * @property {(event: WorkflowEvent) => void} [onEdit] - Callback for editing the event.
 * @property {() => void} [onDelete] - Callback for deleting the event.
 */
export interface WorkflowEventNodeProps {
    event: WorkflowEvent;
    onEdit?: (event: WorkflowEvent) => void;
    onDelete?: () => void;
}

/**
 * @function WorkflowEventNode
 * @param {WorkflowEventNodeProps} props - Props for the component.
 * @returns {JSX.Element} A Node component specifically for workflow events.
 * @description Renders a `Node` component tailored for a `WorkflowEvent`, displaying its type and description.
 */
export const WorkflowEventNode: React.FC<WorkflowEventNodeProps> = React.memo(({ event, onEdit, onDelete }) => (
    <Node
        title={`on: ${event.type}`}
        content={event.description}
        data={event}
        onEdit={onEdit}
        onDelete={onDelete}
        borderColorClass="border-green-700"
        titleColorClass="text-green-400"
    >
        {event.config && Object.keys(event.config).length > 0 && (
            <div className="mt-2 text-xs font-mono bg-slate-900 p-2 rounded max-h-24 overflow-auto">
                {Object.entries(event.config).map(([key, value]) => (
                    <div key={key}>
                        <strong>{key}:</strong> {JSON.stringify(value)}
                    </div>
                ))}
            </div>
        )}
    </Node>
));

/**
 * @interface WorkflowJobNodeProps
 * @description Props for the WorkflowJobNode component.
 * @property {WorkflowJob} job - The workflow job data.
 * @property {WorkflowStep[]} steps - The steps associated with this job.
 * @property {(job: WorkflowJob) => void} [onEditJob] - Callback for editing the job.
 * @property {() => void} [onDeleteJob] - Callback for deleting the job.
 * @property {(jobId: string, step: WorkflowStep) => void} [onAddStep] - Callback for adding a step to this job.
 * @property {(jobId: string, step: WorkflowStep) => void} [onEditStep] - Callback for editing a step within this job.
 * @property {(jobId: string, stepId: string) => void} [onDeleteStep] - Callback for deleting a step within this job.
 */
export interface WorkflowJobNodeProps {
    job: WorkflowJob;
    onEditJob?: (job: WorkflowJob) => void;
    onDeleteJob?: () => void;
    onAddStep?: (jobId: string) => void; // Simplified to just add a step
    onEditStep?: (jobId: string, step: WorkflowStep) => void;
    onDeleteStep?: (jobId: string, stepId: string) => void;
}

/**
 * @function WorkflowJobNode
 * @param {WorkflowJobNodeProps} props - Props for the component.
 * @returns {JSX.Element} A Node component specifically for workflow jobs.
 * @description Renders a `Node` component for a `WorkflowJob`, including its description,
 *              `needs` dependencies, and nested `WorkflowStep` details.
 */
export const WorkflowJobNode: React.FC<WorkflowJobNodeProps> = React.memo(({ job, onEditJob, onDeleteJob, onAddStep, onEditStep, onDeleteStep }) => (
    <Node
        title={`jobs: ${job.name}`}
        content={`Runs on ${job.runsOn}`}
        data={job}
        onEdit={onEditJob}
        onDelete={onDeleteJob}
        borderColorClass="border-blue-700"
        titleColorClass="text-blue-400"
    >
        {job.needs && job.needs.length > 0 && (
            <div className="mt-2 text-xs text-slate-400">
                <span className="font-bold">Needs:</span> {job.needs.join(', ')}
            </div>
        )}
        <h4 className="font-bold text-slate-300 text-sm mt-3 mb-1">Steps:</h4>
        <div className="mt-2 text-xs font-mono bg-slate-900 p-2 rounded space-y-2 max-h-40 overflow-auto">
            {job.steps.length > 0 ? (
                job.steps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between group">
                        <span className="flex-grow">
                            {step.name ? `${step.name} ` : ''}
                            {step.actionType === WorkflowStepActionType.Uses ? `- uses: ${step.actionValue}` : `- run: ${step.actionValue}`}
                        </span>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEditStep && (
                                <button
                                    onClick={() => onEditStep(job.id, step)}
                                    className="text-slate-400 hover:text-cyan-400 p-1 rounded-full hover:bg-slate-700 transition-colors"
                                    aria-label={`Edit step ${step.name || step.id}`}
                                    title={`Edit step ${step.name || step.id}`}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                </button>
                            )}
                            {onDeleteStep && (
                                <button
                                    onClick={() => onDeleteStep(job.id, step.id)}
                                    className="text-slate-400 hover:text-red-400 p-1 rounded-full hover:bg-slate-700 transition-colors"
                                    aria-label={`Delete step ${step.name || step.id}`}
                                    title={`Delete step ${step.name || step.id}`}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-slate-500">No steps defined.</div>
            )}
        </div>
        {onAddStep && (
            <button
                onClick={() => onAddStep(job.id)}
                className="mt-3 w-full bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm py-1.5 rounded-md transition-colors flex items-center justify-center"
                aria-label={`Add step to ${job.name}`}
            >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Add Step
            </button>
        )}
    </Node>
));

// --- Main Designer Components ---

/**
 * @function generateYaml
 * @param {WorkflowDefinition | null} workflow - The workflow definition to convert to YAML.
 * @returns {string} The YAML representation of the workflow.
 * @description Converts a `WorkflowDefinition` object into a YAML string.
 *              This is a simplified generator and might not cover all edge cases of GitHub Actions YAML.
 */
export const generateYaml = (workflow: WorkflowDefinition | null): string => {
    if (!workflow) {
        return '# No workflow defined yet.';
    }

    const yamlLines: string[] = [];

    yamlLines.push(`name: ${workflow.name}`);
    yamlLines.push('on:');
    workflow.on.forEach(event => {
        yamlLines.push(`  ${event.type}:`);
        if (event.config) {
            for (const key in event.config) {
                if (event.config.hasOwnProperty(key)) {
                    yamlLines.push(`    ${key}: ${JSON.stringify(event.config[key])}`);
                }
            }
        }
    });

    yamlLines.push('jobs:');
    workflow.jobs.forEach(job => {
        yamlLines.push(`  ${job.id}:`); // Using ID as the job key in YAML
        yamlLines.push(`    name: ${job.name}`);
        yamlLines.push(`    runs-on: ${job.runsOn}`);
        if (job.needs && job.needs.length > 0) {
            yamlLines.push(`    needs: [${job.needs.join(', ')}]`);
        }
        yamlLines.push('    steps:');
        job.steps.forEach(step => {
            yamlLines.push('      -');
            if (step.name) {
                yamlLines.push(`        name: ${step.name}`);
            }
            if (step.actionType === WorkflowStepActionType.Uses) {
                yamlLines.push(`        uses: ${step.actionValue}`);
            } else { // WorkflowStepActionType.Run
                yamlLines.push(`        run: ${step.actionValue}`);
            }
            if (step.env && Object.keys(step.env).length > 0) {
                yamlLines.push('        env:');
                for (const key in step.env) {
                    if (step.env.hasOwnProperty(key)) {
                        yamlLines.push(`          ${key}: ${step.env[key]}`);
                    }
                }
            }
        });
    });

    return yamlLines.join('\n');
};

/**
 * @interface YamlPreviewProps
 * @description Props for the YamlPreview component.
 * @property {WorkflowDefinition | null} workflow - The workflow definition to display YAML for.
 */
export interface YamlPreviewProps {
    workflow: WorkflowDefinition | null;
}

/**
 * @function YamlPreview
 * @param {YamlPreviewProps} { workflow } - Props for the component.
 * @returns {JSX.Element} A component that displays the generated YAML.
 * @description Displays a read-only preview of the generated GitHub Actions YAML.
 */
export const YamlPreview: React.FC<YamlPreviewProps> = React.memo(({ workflow }) => {
    const yamlContent = useMemo(() => generateYaml(workflow), [workflow]);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col h-full overflow-hidden">
            <h3 className="font-bold text-slate-100 mb-3 text-lg">YAML Preview</h3>
            <pre className="flex-grow bg-slate-900 p-3 rounded text-sm text-slate-300 font-mono overflow-auto whitespace-pre-wrap leading-relaxed">
                {yamlContent}
            </pre>
        </div>
    );
});

/**
 * @interface ToolbarProps
 * @description Props for the Toolbar component.
 * @property {() => void} onSave - Callback for when the save button is clicked.
 * @property {boolean} isSaving - Indicates if a save operation is in progress.
 * @property {boolean} hasWorkflow - Indicates if there's an active workflow to save.
 */
export interface ToolbarProps {
    onSave: () => void;
    isSaving: boolean;
    hasWorkflow: boolean;
}

/**
 * @function Toolbar
 * @param {ToolbarProps} props - Props for the component.
 * @returns {JSX.Element} A toolbar with actions like saving the workflow.
 * @description Provides actions for the workflow designer, such as saving the current workflow.
 */
export const Toolbar: React.FC<ToolbarProps> = React.memo(({ onSave, isSaving, hasWorkflow }) => (
    <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-end space-x-2">
        <button
            onClick={onSave}
            disabled={isSaving || !hasWorkflow}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
            aria-label="Save Workflow"
        >
            {isSaving && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {isSaving ? 'Saving...' : 'Save Workflow'}
        </button>
    </div>
));

/**
 * @interface SidebarProps
 * @description Props for the Sidebar component.
 * @property {(type: 'event' | 'job' | 'step', jobId?: string) => void} onAddElement - Callback for adding new elements.
 */
export interface SidebarProps {
    onAddElement: (type: 'event' | 'job', jobId?: string) => void; // Simplified for now, step addition is within job node
}

/**
 * @function Sidebar
 * @param {SidebarProps} { onAddElement } - Props for the component.
 * @returns {JSX.Element} A sidebar component for adding new workflow elements.
 * @description Provides controls to add new events, jobs, or steps to the workflow.
 */
export const Sidebar: React.FC<SidebarProps> = React.memo(({ onAddElement }) => (
    <div className="bg-slate-800 border-l border-slate-700 p-4 w-64 flex-shrink-0 flex flex-col">
        <h3 className="font-bold text-slate-100 mb-4 text-lg">Add Elements</h3>
        <div className="space-y-3">
            <button
                onClick={() => onAddElement('event')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center"
                aria-label="Add Event Trigger"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Add Event
            </button>
            <button
                onClick={() => onAddElement('job')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center"
                aria-label="Add Job"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v12a2 2 0 11-4 0V4zm0 0H9m-1.429 2.115L.884 14.854a.75.75 0 00-.009.845l.93 1.396C2.262 17.514 3.324 18 4.5 18h15c1.176 0 2.238-.486 2.695-1.905l.93-1.396a.75.75 0 00-.01-.845L15.429 6.115a2.25 2.25 0 00-4.428 0z"></path></svg>
                Add Job
            </button>
        </div>
    </div>
));

/**
 * @interface EditModalProps
 * @description Props for the EditModal component.
 * @property {boolean} isOpen - Controls the visibility of the modal.
 * @property {() => void} onClose - Callback to close the modal.
 * @property {string} title - The title of the modal.
 * @property {React.ReactNode} children - The content to display inside the modal.
 */
export interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

/**
 * @function EditModal
 * @param {EditModalProps} props - Props for the component.
 * @returns {JSX.Element | null} A modal component for editing workflow elements.
 * @description A generic modal component to display forms for editing workflow elements.
 */
export const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={onClose}>
            <div
                className="bg-slate-800 rounded-lg p-6 w-full max-w-lg shadow-xl border border-slate-700 relative"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <h3 id="modal-title" className="text-xl font-bold text-slate-100 mb-4">{title}</h3>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors"
                    aria-label="Close modal"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div className="mt-4">
                    {children}
                </div>
            </div>
        </div>
    );
};


// Component: GithubActionsDesigner
/**
 * @function GithubActionsDesigner
 * @returns {JSX.Element} The main GitHub Actions Designer application component.
 * @description This is the root component for the GitHub Actions visual workflow designer.
 *              It orchestrates the layout, state, and interaction of workflow elements,
 *              providing a visual representation, editing capabilities, and a YAML preview.
 *              It utilizes the `WorkflowProvider` for global state management and an `ErrorBoundary`
 *              for robust error handling.
 */
export const GithubActionsDesigner: React.FC = () => {
    const { state, dispatch, saveWorkflow } = useWorkflow();
    const { workflow, isLoading, error } = state;

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
    const [modalTitle, setModalTitle] = useState('');

    const openEditModal = useCallback((title: string, content: React.ReactNode) => {
        setModalTitle(title);
        setModalContent(content);
        setIsEditModalOpen(true);
    }, []);

    const closeEditModal = useCallback(() => {
        setIsEditModalOpen(false);
        setModalContent(null);
        setModalTitle('');
    }, []);

    const handleSaveWorkflow = useCallback(() => {
        if (workflow) {
            saveWorkflow(workflow);
        }
    }, [workflow, saveWorkflow]);

    const handleAddEvent = useCallback(() => {
        const newEvent: WorkflowEvent = {
            id: `event-${Date.now()}`,
            type: WorkflowEventTrigger.Push,
            description: 'New push event (edit me)',
            config: { branches: ['main'] }
        };
        const Form = () => {
            const [localEvent, setLocalEvent] = useState<WorkflowEvent>(newEvent);
            const handleSubmit = (e: React.FormEvent) => {
                e.preventDefault();
                dispatch({ type: WorkflowActionType.ADD_EVENT, payload: localEvent });
                closeEditModal();
            };
            return (
                <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
                    <div>
                        <label className="block text-sm font-bold mb-1">Event Type</label>
                        <select
                            value={localEvent.type}
                            onChange={(e) => setLocalEvent({ ...localEvent, type: e.target.value as WorkflowEventTrigger })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        >
                            {Object.values(WorkflowEventTrigger).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Description</label>
                        <input
                            type="text"
                            value={localEvent.description}
                            onChange={(e) => setLocalEvent({ ...localEvent, description: e.target.value })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">Add Event</button>
                </form>
            );
        };
        openEditModal('Add New Event', <Form />);
    }, [dispatch, openEditModal, closeEditModal]);

    const handleEditEvent = useCallback((eventToEdit: WorkflowEvent) => {
        const Form = () => {
            const [localEvent, setLocalEvent] = useState<WorkflowEvent>(eventToEdit);
            const handleSubmit = (e: React.FormEvent) => {
                e.preventDefault();
                dispatch({ type: WorkflowActionType.UPDATE_EVENT, payload: localEvent });
                closeEditModal();
            };
            return (
                <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
                    <div>
                        <label className="block text-sm font-bold mb-1">Event Type</label>
                        <select
                            value={localEvent.type}
                            onChange={(e) => setLocalEvent({ ...localEvent, type: e.target.value as WorkflowEventTrigger })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        >
                            {Object.values(WorkflowEventTrigger).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Description</label>
                        <input
                            type="text"
                            value={localEvent.description}
                            onChange={(e) => setLocalEvent({ ...localEvent, description: e.target.value })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    {/* Simplified config editing for demo */}
                    {localEvent.type === WorkflowEventTrigger.Push && (
                        <div>
                            <label className="block text-sm font-bold mb-1">Branches (comma-separated)</label>
                            <input
                                type="text"
                                value={(localEvent.config?.branches || []).join(', ')}
                                onChange={(e) => setLocalEvent({ ...localEvent, config: { ...localEvent.config, branches: e.target.value.split(',').map(b => b.trim()).filter(Boolean) } })}
                                className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    )}
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">Save Event</button>
                </form>
            );
        };
        openEditModal('Edit Event', <Form />);
    }, [dispatch, openEditModal, closeEditModal]);

    const handleDeleteEvent = useCallback((eventId: string) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            dispatch({ type: WorkflowActionType.DELETE_EVENT, payload: eventId });
        }
    }, [dispatch]);

    const handleAddJob = useCallback(() => {
        const newJob: WorkflowJob = {
            id: `job-${Date.now()}`,
            name: 'New Job (edit me)',
            runsOn: 'ubuntu-latest',
            steps: [],
        };
        const Form = () => {
            const [localJob, setLocalJob] = useState<WorkflowJob>(newJob);
            const handleSubmit = (e: React.FormEvent) => {
                e.preventDefault();
                dispatch({ type: WorkflowActionType.ADD_JOB, payload: localJob });
                closeEditModal();
            };
            return (
                <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
                    <div>
                        <label className="block text-sm font-bold mb-1">Job Name</label>
                        <input
                            type="text"
                            value={localJob.name}
                            onChange={(e) => setLocalJob({ ...localJob, name: e.target.value })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Runs On</label>
                        <input
                            type="text"
                            value={localJob.runsOn}
                            onChange={(e) => setLocalJob({ ...localJob, runsOn: e.target.value })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">Add Job</button>
                </form>
            );
        };
        openEditModal('Add New Job', <Form />);
    }, [dispatch, openEditModal, closeEditModal]);

    const handleEditJob = useCallback((jobToEdit: WorkflowJob) => {
        const Form = () => {
            const [localJob, setLocalJob] = useState<WorkflowJob>(jobToEdit);
            const handleSubmit = (e: React.FormEvent) => {
                e.preventDefault();
                dispatch({ type: WorkflowActionType.UPDATE_JOB, payload: localJob });
                closeEditModal();
            };
            return (
                <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
                    <div>
                        <label className="block text-sm font-bold mb-1">Job Name</label>
                        <input
                            type="text"
                            value={localJob.name}
                            onChange={(e) => setLocalJob({ ...localJob, name: e.target.value })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Runs On</label>
                        <input
                            type="text"
                            value={localJob.runsOn}
                            onChange={(e) => setLocalJob({ ...localJob, runsOn: e.target.value })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Needs (comma-separated job IDs)</label>
                        <input
                            type="text"
                            value={(localJob.needs || []).join(', ')}
                            onChange={(e) => setLocalJob({ ...localJob, needs: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">Save Job</button>
                </form>
            );
        };
        openEditModal('Edit Job', <Form />);
    }, [dispatch, openEditModal, closeEditModal]);

    const handleDeleteJob = useCallback((jobId: string) => {
        if (window.confirm("Are you sure you want to delete this job and all its steps?")) {
            dispatch({ type: WorkflowActionType.DELETE_JOB, payload: jobId });
        }
    }, [dispatch]);

    const handleAddStep = useCallback((jobId: string) => {
        const newStep: WorkflowStep = {
            id: `step-${Date.now()}`,
            name: 'New Step (edit me)',
            actionType: WorkflowStepActionType.Run,
            actionValue: 'echo "Hello world!"',
        };
        const Form = () => {
            const [localStep, setLocalStep] = useState<WorkflowStep>(newStep);
            const handleSubmit = (e: React.FormEvent) => {
                e.preventDefault();
                dispatch({ type: WorkflowActionType.ADD_STEP, payload: { jobId, step: localStep } });
                closeEditModal();
            };
            return (
                <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
                    <div>
                        <label className="block text-sm font-bold mb-1">Step Name (Optional)</label>
                        <input
                            type="text"
                            value={localStep.name || ''}
                            onChange={(e) => setLocalStep({ ...localStep, name: e.target.value })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Action Type</label>
                        <select
                            value={localStep.actionType}
                            onChange={(e) => setLocalStep({ ...localStep, actionType: e.target.value as WorkflowStepActionType })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        >
                            <option value={WorkflowStepActionType.Run}>Run Command</option>
                            <option value={WorkflowStepActionType.Uses}>Use Action</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">
                            {localStep.actionType === WorkflowStepActionType.Run ? 'Command (e.g., npm install)' : 'Action (e.g., actions/checkout@v2)'}
                        </label>
                        <input
                            type="text"
                            value={localStep.actionValue}
                            onChange={(e) => setLocalStep({ ...localStep, actionValue: e.target.value })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">Add Step</button>
                </form>
            );
        };
        openEditModal('Add New Step', <Form />);
    }, [dispatch, openEditModal, closeEditModal]);

    const handleEditStep = useCallback((jobId: string, stepToEdit: WorkflowStep) => {
        const Form = () => {
            const [localStep, setLocalStep] = useState<WorkflowStep>(stepToEdit);
            const handleSubmit = (e: React.FormEvent) => {
                e.preventDefault();
                dispatch({ type: WorkflowActionType.UPDATE_STEP, payload: { jobId, step: localStep } });
                closeEditModal();
            };
            return (
                <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
                    <div>
                        <label className="block text-sm font-bold mb-1">Step Name (Optional)</label>
                        <input
                            type="text"
                            value={localStep.name || ''}
                            onChange={(e) => setLocalStep({ ...localStep, name: e.target.value })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Action Type</label>
                        <select
                            value={localStep.actionType}
                            onChange={(e) => setLocalStep({ ...localStep, actionType: e.target.value as WorkflowStepActionType })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        >
                            <option value={WorkflowStepActionType.Run}>Run Command</option>
                            <option value={WorkflowStepActionType.Uses}>Use Action</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">
                            {localStep.actionType === WorkflowStepActionType.Run ? 'Command (e.g., npm install)' : 'Action (e.g., actions/checkout@v2)'}
                        </label>
                        <input
                            type="text"
                            value={localStep.actionValue}
                            onChange={(e) => setLocalStep({ ...localStep, actionValue: e.target.value })}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    {/* Simplified env editing for demo */}
                    {localStep.env && Object.keys(localStep.env).length > 0 && (
                        <div>
                            <label className="block text-sm font-bold mb-1">Environment Variables (JSON)</label>
                            <textarea
                                value={JSON.stringify(localStep.env, null, 2)}
                                onChange={(e) => {
                                    try {
                                        setLocalStep({ ...localStep, env: JSON.parse(e.target.value) });
                                    } catch {
                                        // Ignore malformed JSON for now
                                    }
                                }}
                                rows={3}
                                className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                            ></textarea>
                        </div>
                    )}
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">Save Step</button>
                </form>
            );
        };
        openEditModal('Edit Step', <Form />);
    }, [dispatch, openEditModal, closeEditModal]);

    const handleDeleteStep = useCallback((jobId: string, stepId: string) => {
        if (window.confirm("Are you sure you want to delete this step?")) {
            dispatch({ type: WorkflowActionType.DELETE_STEP, payload: { jobId, stepId } });
        }
    }, [dispatch]);

    const handleAddElementFromSidebar = useCallback((type: 'event' | 'job') => {
        if (type === 'event') handleAddEvent();
        if (type === 'job') handleAddJob();
    }, [handleAddEvent, handleAddJob]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center text-slate-400">
                <svg className="animate-spin h-8 w-8 mr-3 text-cyan-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading workflow...
            </div>
        );
    }

    return (
        <ErrorBoundary fallback={<div className="p-8 text-center bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            <h2 className="text-xl font-bold">Workflow Designer crashed!</h2>
            <p>Please refresh the page to try again.</p>
        </div>}>
            <div className="h-full flex flex-col bg-slate-900">
                <header className="p-4 sm:p-6 lg:p-8 bg-slate-800 border-b border-slate-700">
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <GitBranchIcon className="text-cyan-400" />
                        <span className="ml-3">GitHub Actions Designer</span>
                    </h1>
                    <p className="text-slate-400 mt-1">A visual editor for GitHub Actions workflows.</p>
                    {error && (
                        <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-md text-red-300 text-sm">
                            Error: {error}
                        </div>
                    )}
                </header>

                <Toolbar onSave={handleSaveWorkflow} isSaving={state.isLoading} hasWorkflow={!!workflow} />

                <div className="flex-grow flex overflow-hidden">
                    {/* Workflow Canvas */}
                    <main className="flex-grow flex flex-col p-4 sm:p-6 lg:p-8 overflow-auto">
                        <div className="flex-grow flex flex-col items-center justify-center bg-slate-900/50 p-8 rounded-lg border-2 border-dashed border-slate-700 min-h-[500px]">
                            {workflow ? (
                                <div className="flex items-start gap-4">
                                    {/* Events Column */}
                                    <div className="flex flex-col gap-4">
                                        {workflow.on.map(event => (
                                            <WorkflowEventNode
                                                key={event.id}
                                                event={event}
                                                onEdit={handleEditEvent}
                                                onDelete={() => handleDeleteEvent(event.id)}
                                            />
                                        ))}
                                    </div>

                                    {workflow.on.length > 0 && workflow.jobs.length > 0 && <Arrow />}

                                    {/* Jobs Column */}
                                    <div className="flex flex-col gap-4">
                                        {workflow.jobs.map(job => (
                                            <WorkflowJobNode
                                                key={job.id}
                                                job={job}
                                                onEditJob={handleEditJob}
                                                onDeleteJob={() => handleDeleteJob(job.id)}
                                                onAddStep={handleAddStep}
                                                onEditStep={handleEditStep}
                                                onDeleteStep={handleDeleteStep}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-500 text-lg">
                                    No workflow loaded. Use the sidebar to add events and jobs!
                                </div>
                            )}
                        </div>
                    </main>

                    {/* Right Sidebar for YAML Preview */}
                    <div className="w-1/3 min-w-[300px] max-w-[500px] bg-slate-800 border-l border-slate-700 p-4 flex flex-col overflow-auto">
                        <YamlPreview workflow={workflow} />
                    </div>

                    {/* Left Sidebar for Adding Elements */}
                    <Sidebar onAddElement={handleAddElementFromSidebar} />
                </div>

                <EditModal isOpen={isEditModalOpen} onClose={closeEditModal} title={modalTitle}>
                    {modalContent}
                </EditModal>
            </div>
        </ErrorBoundary>
    );
};

// Wrap the main designer with its provider for use in App.tsx
// This allows other components in the combined App.tsx to potentially use `useWorkflow` if needed.
export const GitHubActionsDesignerApp: React.FC = () => (
    <WorkflowProvider>
        <GithubActionsDesigner />
    </WorkflowProvider>
);