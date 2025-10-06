// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';
import { BugAntIcon } from '../icons/FeatureIcons.tsx';

// --- Global Types and Interfaces for Dependency Management ---
/**
 * @typedef {('ok' | 'outdated' | 'conflict' | 'unknown')} DependencyStatus
 * Represents the status of a dependency.
 */
export type DependencyStatus = 'ok' | 'outdated' | 'conflict' | 'unknown';

/**
 * @interface Dependency
 * Defines the structure for a single project dependency.
 */
export interface Dependency {
    id: string; // Unique identifier for the dependency (e.g., package name or a generated UUID).
    name: string; // The name of the dependency.
    version: string; // The currently installed version.
    status: DependencyStatus; // The current status of the dependency.
    severity?: 'low' | 'medium' | 'high'; // Optional: Indicates the severity of the status (e.g., high for conflict).
    description?: string; // Optional: A brief description of the dependency.
    latestVersion?: string; // Optional: The latest available version if outdated.
    resolutionSteps?: string[]; // Optional: Steps to resolve issues like conflicts or outdated versions.
}

/**
 * @interface DependencyState
 * Represents the state managed by the DependencyContext.
 */
export interface DependencyState {
    dependencies: Dependency[]; // The list of all dependencies.
    loading: boolean; // Indicates if dependencies are currently being loaded.
    error: string | null; // Stores any error message during dependency operations.
    selectedDependency: Dependency | null; // The dependency currently selected for detailed view.
    filterText: string; // Text used to filter dependencies by name.
    filterStatus: DependencyStatus | 'all'; // Status used to filter dependencies.
}

/**
 * @typedef DependencyAction
 * Defines the actions that can be dispatched to the dependencyReducer.
 */
export type DependencyAction =
    | { type: 'FETCH_START' } // Action to signify the start of fetching dependencies.
    | { type: 'FETCH_SUCCESS'; payload: Dependency[] } // Action for successful dependency fetch.
    | { type: 'FETCH_ERROR'; payload: string } // Action for error during dependency fetch.
    | { type: 'SELECT_DEPENDENCY'; payload: string | null } // Action to select a dependency by ID.
    | { type: 'UPDATE_DEPENDENCY_STATUS'; payload: { id: string; status: DependencyStatus } } // Action to update a dependency's status.
    | { type: 'ADD_DEPENDENCY'; payload: Dependency } // Action to add a new dependency.
    | { type: 'REMOVE_DEPENDENCY'; payload: string } // Action to remove a dependency by ID.
    | { type: 'SET_FILTER_TEXT'; payload: string } // Action to set the search filter text.
    | { type: 'SET_FILTER_STATUS'; payload: DependencyStatus | 'all' }; // Action to set the status filter.

/**
 * @interface DependencyContextType
 * Defines the shape of the DependencyContext, including state and dispatch methods.
 */
export interface DependencyContextType extends DependencyState {
    dispatch: React.Dispatch<DependencyAction>;
    refreshDependencies: () => void;
    selectDependency: (id: string | null) => void;
    updateDependencyStatus: (id: string, status: DependencyStatus) => void;
    addDependency: (dep: Dependency) => void;
    removeDependency: (id: string) => void;
    setFilterText: (text: string) => void;
    setFilterStatus: (status: DependencyStatus | 'all') => void;
}

// --- Mock Data for Simulation ---
/**
 * @constant {Dependency[]} mockDeps
 * Simulated data representing project dependencies.
 * Enhanced with more details to support the new features.
 */
const mockDeps: Dependency[] = [
    {
        id: 'react',
        name: 'react',
        version: '18.2.0',
        status: 'ok',
        severity: 'low',
        description: 'React is a JavaScript library for building user interfaces.',
    },
    {
        id: '@google/genai',
        name: '@google/genai',
        version: '1.12.0',
        status: 'ok',
        severity: 'low',
        description: 'Official Google Gemini API client for JavaScript/TypeScript.',
    },
    {
        id: 'old-library',
        name: 'old-library',
        version: '1.3.4',
        status: 'outdated',
        severity: 'medium',
        description: 'An example of an outdated library. Consider updating for security and features.',
        latestVersion: '2.0.0',
    },
    {
        id: 'conflicting-dep',
        name: 'conflicting-dep',
        version: '2.1.0',
        status: 'conflict',
        severity: 'high',
        description: 'This dependency has known conflicts with other packages in the project.',
        resolutionSteps: [
            'Check `npm ls conflicting-dep` for resolution tree.',
            'Try installing with `--force` or `--legacy-peer-deps`.',
            'Consider alternative packages or version ranges.',
        ],
    },
    {
        id: 'xterm',
        name: 'xterm',
        version: '5.5.0',
        status: 'ok',
        severity: 'low',
        description: 'A terminal front-end for the browser.',
    },
    {
        id: 'marked',
        name: 'marked',
        version: '13.0.2',
        status: 'ok',
        severity: 'low',
        description: 'A markdown parser and compiler written in JavaScript.',
    },
    {
        id: 'bad-module',
        name: 'bad-module',
        version: '0.0.1',
        status: 'unknown',
        severity: 'high',
        description: 'This module\'s status could not be determined. Investigation recommended.',
    },
];

// --- Dependency Context and Reducer for State Management ---
/**
 * @constant {React.Context<DependencyContextType | undefined>} DependencyContext
 * React Context for managing and providing dependency-related state.
 */
export const DependencyContext = React.createContext<DependencyContextType | undefined>(undefined);

/**
 * @function dependencyReducer
 * Reducer function to manage the DependencyState based on dispatched actions.
 * @param {DependencyState} state - The current state.
 * @param {DependencyAction} action - The action to be performed.
 * @returns {DependencyState} The new state.
 */
const dependencyReducer = (state: DependencyState, action: DependencyAction): DependencyState => {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, loading: true, error: null };
        case 'FETCH_SUCCESS':
            return { ...state, loading: false, dependencies: action.payload };
        case 'FETCH_ERROR':
            return { ...state, loading: false, error: action.payload };
        case 'SELECT_DEPENDENCY':
            return { ...state, selectedDependency: state.dependencies.find(dep => dep.id === action.payload) || null };
        case 'UPDATE_DEPENDENCY_STATUS':
            return {
                ...state,
                dependencies: state.dependencies.map(dep =>
                    dep.id === action.payload.id ? { ...dep, status: action.payload.status } : dep
                ),
                selectedDependency: state.selectedDependency?.id === action.payload.id
                    ? { ...state.selectedDependency, status: action.payload.status }
                    : state.selectedDependency,
            };
        case 'ADD_DEPENDENCY':
            return {
                ...state,
                dependencies: [...state.dependencies, action.payload],
            };
        case 'REMOVE_DEPENDENCY':
            return {
                ...state,
                dependencies: state.dependencies.filter(dep => dep.id !== action.payload),
                selectedDependency: state.selectedDependency?.id === action.payload ? null : state.selectedDependency,
            };
        case 'SET_FILTER_TEXT':
            return { ...state, filterText: action.payload };
        case 'SET_FILTER_STATUS':
            return { ...state, filterStatus: action.payload };
        default:
            return state;
    }
};

/**
 * @component DependencyProvider
 * Provides the dependency state and actions to its children components via Context API.
 * It also handles the initial fetching of dependencies and refresh logic.
 * @param {React.PropsWithChildren<{}>} props - React children.
 */
export const DependencyProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [state, dispatch] = React.useReducer(dependencyReducer, {
        dependencies: [],
        loading: false,
        error: null,
        selectedDependency: null,
        filterText: '',
        filterStatus: 'all',
    });

    /**
     * @function fetchDependencies
     * Simulates an asynchronous API call to fetch dependencies.
     * Includes simulated network delay and error handling.
     * @returns {Promise<void>}
     */
    const fetchDependencies = React.useCallback(async () => {
        dispatch({ type: 'FETCH_START' });
        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
            // Simulate an error ~10% of the time
            if (Math.random() < 0.1) {
                throw new Error('Failed to fetch dependencies due to a network issue. Please try again.');
            }
            dispatch({ type: 'FETCH_SUCCESS', payload: mockDeps });
        } catch (err: any) {
            dispatch({ type: 'FETCH_ERROR', payload: err.message || 'An unknown error occurred during fetch.' });
        }
    }, []);

    // Effect to fetch dependencies on component mount.
    React.useEffect(() => {
        fetchDependencies();
    }, [fetchDependencies]);

    /**
     * @function refreshDependencies
     * Public method to trigger a re-fetch of dependencies.
     */
    const refreshDependencies = React.useCallback(() => {
        fetchDependencies();
    }, [fetchDependencies]);

    /**
     * @function selectDependency
     * Public method to select a dependency by its ID to show details.
     * @param {string | null} id - The ID of the dependency to select, or null to deselect.
     */
    const selectDependency = React.useCallback((id: string | null) => {
        dispatch({ type: 'SELECT_DEPENDENCY', payload: id });
    }, []);

    /**
     * @function updateDependencyStatus
     * Public method to update the status of a specific dependency.
     * @param {string} id - The ID of the dependency.
     * @param {DependencyStatus} status - The new status.
     */
    const updateDependencyStatus = React.useCallback((id: string, status: DependencyStatus) => {
        dispatch({ type: 'UPDATE_DEPENDENCY_STATUS', payload: { id, status } });
    }, []);

    /**
     * @function addDependency
     * Public method to add a new dependency to the list.
     * @param {Dependency} dep - The dependency object to add.
     */
    const addDependency = React.useCallback((dep: Dependency) => {
        dispatch({ type: 'ADD_DEPENDENCY', payload: dep });
    }, []);

    /**
     * @function removeDependency
     * Public method to remove a dependency by its ID.
     * @param {string} id - The ID of the dependency to remove.
     */
    const removeDependency = React.useCallback((id: string) => {
        dispatch({ type: 'REMOVE_DEPENDENCY', payload: id });
    }, []);

    /**
     * @function setFilterText
     * Public method to update the search filter text.
     * @param {string} text - The text to filter dependencies by name.
     */
    const setFilterText = React.useCallback((text: string) => {
        dispatch({ type: 'SET_FILTER_TEXT', payload: text });
    }, []);

    /**
     * @function setFilterStatus
     * Public method to update the status filter.
     * @param {DependencyStatus | 'all'} status - The status to filter dependencies by.
     */
    const setFilterStatus = React.useCallback((status: DependencyStatus | 'all') => {
        dispatch({ type: 'SET_FILTER_STATUS', payload: status });
    }, []);

    // Memoize the context value to prevent unnecessary re-renders of consumers.
    const contextValue = React.useMemo(() => ({
        ...state,
        dispatch,
        refreshDependencies,
        selectDependency,
        updateDependencyStatus,
        addDependency,
        removeDependency,
        setFilterText,
        setFilterStatus,
    }), [state, refreshDependencies, selectDependency, updateDependencyStatus, addDependency, removeDependency, setFilterText, setFilterStatus]);

    return (
        <DependencyContext.Provider value={contextValue}>
            {children}
        </DependencyContext.Provider>
    );
};

/**
 * @hook useDependencies
 * Custom hook to easily consume the DependencyContext.
 * @returns {DependencyContextType} The dependency context value.
 * @throws {Error} If used outside of a DependencyProvider.
 */
export const useDependencies = () => {
    const context = React.useContext(DependencyContext);
    if (context === undefined) {
        throw new Error('useDependencies must be used within a DependencyProvider');
    }
    return context;
};

// --- Sub-Components for Dependency Inspector ---

// NOTE: The following CSS for custom-scrollbar is illustrative. In a real project,
// this would typically be in a global CSS file or defined using a CSS-in-JS library.
/*
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: #1e293b; // slate-800
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #475569; // slate-600
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #64748b; // slate-500
}
*/

/**
 * @interface StatusIndicatorProps
 * Props for the StatusIndicator component.
 */
interface StatusIndicatorProps {
    status: DependencyStatus; // The status to display.
}

/**
 * @component StatusIndicator
 * Displays a colored dot indicating the status of a dependency.
 * Memoized for performance.
 * @param {StatusIndicatorProps} props - Component props.
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = React.memo(({ status }) => {
    const statusClasses: Record<DependencyStatus, { className: string; title: string }> = {
        'ok': { className: 'bg-green-500', title: 'OK' },
        'outdated': { className: 'bg-yellow-500', title: 'Outdated' },
        'conflict': { className: 'bg-red-500', title: 'Conflict' },
        'unknown': { className: 'bg-gray-500', title: 'Unknown Status' },
    };

    const { className, title } = statusClasses[status] || statusClasses['unknown'];

    return (
        <div className={`w-3 h-3 rounded-full ${className}`} title={title} role="status" aria-label={`Dependency status: ${title}`}></div>
    );
});
StatusIndicator.displayName = 'StatusIndicator'; // Aid debugging and profiling.

/**
 * @interface DependencyItemProps
 * Props for the DependencyItem component.
 */
interface DependencyItemProps {
    dependency: Dependency; // The dependency data to display.
    isSelected: boolean; // True if this item is currently selected.
    onSelect: (id: string) => void; // Callback when the item is selected.
}

/**
 * @component DependencyItem
 * Displays a single dependency in the list, allowing selection for details.
 * Memoized for performance.
 * @param {DependencyItemProps} props - Component props.
 */
export const DependencyItem: React.FC<DependencyItemProps> = React.memo(({ dependency, isSelected, onSelect }) => {
    const handleSelect = React.useCallback(() => {
        onSelect(dependency.id);
    }, [dependency.id, onSelect]);

    return (
        <button
            onClick={handleSelect}
            className={`
                bg-slate-800/50 p-3 rounded-md flex justify-between items-center transition-colors duration-200 w-full
                hover:bg-slate-700/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900
                ${isSelected ? 'border border-blue-500 shadow-lg' : 'border border-transparent'}
            `}
            aria-current={isSelected ? 'true' : undefined}
            aria-label={`View details for ${dependency.name} version ${dependency.version}`}
            role="listitem"
        >
            <div className="flex items-center gap-3">
                <StatusIndicator status={dependency.status} />
                <span className="font-bold text-slate-200 text-left">{dependency.name}</span>
            </div>
            <span className="font-mono text-sm text-slate-400">{dependency.version}</span>
        </button>
    );
});
DependencyItem.displayName = 'DependencyItem';

/**
 * @interface DependencyDetailsPanelProps
 * Props for the DependencyDetailsPanel component.
 */
interface DependencyDetailsPanelProps {
    dependency: Dependency | null; // The selected dependency to display details for, or null.
    onClose: () => void; // Callback to close the details panel.
    onUpdateStatus: (id: string, status: DependencyStatus) => void; // Callback to update a dependency's status.
    onRemove: (id: string) => void; // Callback to remove a dependency.
}

/**
 * @component DependencyDetailsPanel
 * Displays detailed information and actionable buttons for a selected dependency.
 * @param {DependencyDetailsPanelProps} props - Component props.
 */
export const DependencyDetailsPanel: React.FC<DependencyDetailsPanelProps> = ({ dependency, onClose, onUpdateStatus, onRemove }) => {
    // Render a placeholder if no dependency is selected.
    if (!dependency) {
        return (
            <div className="w-full lg:w-1/3 p-4 bg-slate-900 rounded-lg flex flex-col justify-center items-center text-slate-400 text-center">
                <p className="text-lg">Select a dependency to view details.</p>
                <p className="mt-2 text-sm">Use the list on the left to inspect packages.</p>
            </div>
        );
    }

    // Memoized callback for updating dependency status.
    const handleUpdateStatus = React.useCallback((status: DependencyStatus) => {
        onUpdateStatus(dependency.id, status);
    }, [dependency.id, onUpdateStatus]);

    // Memoized callback for removing a dependency with confirmation.
    const handleRemove = React.useCallback(() => {
        if (window.confirm(`Are you sure you want to remove '${dependency.name}'? This action cannot be undone.`)) {
            onRemove(dependency.id);
            onClose(); // Close the panel after removal for better UX.
        }
    }, [dependency.id, dependency.name, onRemove, onClose]);

    // Style mappings for different status and severity levels.
    const statusColors: Record<DependencyStatus, string> = {
        'ok': 'text-green-400',
        'outdated': 'text-yellow-400',
        'conflict': 'text-red-400',
        'unknown': 'text-gray-400',
    };

    const severityColors: Record<NonNullable<Dependency['severity']>, string> = {
        'low': 'text-green-300',
        'medium': 'text-yellow-300',
        'high': 'text-red-300',
    };

    return (
        <aside className="w-full lg:w-1/3 p-4 bg-slate-900 rounded-lg shadow-lg flex flex-col" aria-labelledby="dependency-details-title">
            <div className="flex justify-between items-center mb-4">
                <h2 id="dependency-details-title" className="text-xl font-bold text-slate-100">{dependency.name}</h2>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-200 transition-colors text-2xl leading-none"
                    aria-label="Close details panel"
                >
                    &times;
                </button>
            </div>

            <div className="space-y-3 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                <p>
                    <span className="font-semibold text-slate-300">Version:</span>{' '}
                    <span className="font-mono text-slate-400">{dependency.version}</span>
                </p>
                <p>
                    <span className="font-semibold text-slate-300">Status:</span>{' '}
                    <span className={`font-mono ${statusColors[dependency.status]}`}>{dependency.status.toUpperCase()}</span>
                    {dependency.latestVersion && dependency.status === 'outdated' && (
                        <span className="ml-2 text-sm text-yellow-500" aria-label={`Latest version available: ${dependency.latestVersion}`}>
                            (Latest: {dependency.latestVersion})
                        </span>
                    )}
                </p>
                {dependency.severity && (
                    <p>
                        <span className="font-semibold text-slate-300">Severity:</span>{' '}
                        <span className={`font-mono ${severityColors[dependency.severity]}`}>{dependency.severity.toUpperCase()}</span>
                    </p>
                )}
                {dependency.description && (
                    <p>
                        <span className="font-semibold text-slate-300">Description:</span>{' '}
                        <span className="text-slate-400">{dependency.description}</span>
                    </p>
                )}
                {dependency.resolutionSteps && dependency.resolutionSteps.length > 0 && (
                    <div>
                        <span className="font-semibold text-slate-300">Resolution Steps:</span>
                        <ul className="list-disc list-inside text-slate-400 mt-1">
                            {dependency.resolutionSteps.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="mt-6 border-t border-slate-700 pt-4 flex flex-wrap gap-2">
                <span className="text-slate-400 text-sm w-full mb-1" id="dependency-actions-label">Actions:</span>
                {dependency.status === 'outdated' && (
                    <button
                        onClick={() => handleUpdateStatus('ok')}
                        className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
                        aria-label={`Update ${dependency.name} to latest version`}
                    >
                        Update
                    </button>
                )}
                {dependency.status === 'conflict' && (
                    <button
                        onClick={() => handleUpdateStatus('ok')}
                        className="flex-1 min-w-[120px] bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
                        aria-label={`Resolve conflict for ${dependency.name}`}
                    >
                        Resolve Conflict
                    </button>
                )}
                <button
                    onClick={() => handleUpdateStatus('unknown')}
                    className="flex-1 min-w-[120px] bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
                    aria-label={`Mark ${dependency.name} as unknown status`}
                >
                    Mark Unknown
                </button>
                <button
                    onClick={handleRemove}
                    className="flex-1 min-w-[120px] bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
                    aria-label={`Remove ${dependency.name} from project`}
                >
                    Remove
                </button>
            </div>
        </aside>
    );
};
DependencyDetailsPanel.displayName = 'DependencyDetailsPanel';

/**
 * @component AddDependencyForm
 * A form for adding new dependencies to the list.
 */
export const AddDependencyForm: React.FC = () => {
    const { addDependency } = useDependencies();
    const [name, setName] = React.useState('');
    const [version, setVersion] = React.useState('');
    const [status, setStatus] = React.useState<DependencyStatus>('ok');

    /**
     * @function handleSubmit
     * Handles the form submission to add a new dependency.
     * @param {React.FormEvent} e - The form event.
     */
    const handleSubmit = React.useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && version.trim()) {
            const newDep: Dependency = {
                id: name.toLowerCase().replace(/\s+/g, '-'), // Simple ID generation
                name: name.trim(),
                version: version.trim(),
                status,
                severity: status === 'conflict' ? 'high' : status === 'outdated' ? 'medium' : 'low',
                description: `Manually added dependency: ${name} v${version}.`,
            };
            addDependency(newDep);
            setName('');
            setVersion('');
            setStatus('ok'); // Reset status to default
        }
    }, [name, version, status, addDependency]);

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-900 rounded-lg shadow-lg space-y-3 mb-6" aria-label="Add new dependency form">
            <h2 className="text-xl font-bold text-slate-100">Add New Dependency</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                    type="text"
                    placeholder="Dependency Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="p-2 rounded bg-slate-800 text-slate-100 placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Dependency Name"
                    required
                />
                <input
                    type="text"
                    placeholder="Version (e.g., 1.0.0)"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="p-2 rounded bg-slate-800 text-slate-100 placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Dependency Version"
                    pattern="^\d+\.\d+\.\d+$" // Basic semantic versioning pattern
                    title="Please enter a version in X.Y.Z format (e.g., 1.0.0)"
                    required
                />
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DependencyStatus)}
                    className="p-2 rounded bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
                    aria-label="Dependency Status"
                >
                    <option value="ok">OK</option>
                    <option value="outdated">Outdated</option>
                    <option value="conflict">Conflict</option>
                    <option value="unknown">Unknown</option>
                </select>
            </div>
            <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                aria-label="Add dependency to the list"
            >
                Add Dependency
            </button>
        </form>
    );
};
AddDependencyForm.displayName = 'AddDependencyForm';

/**
 * @component FilterControls
 * Provides input fields for searching and filtering dependencies by status,
 * and a button to refresh the dependency list.
 */
export const FilterControls: React.FC = () => {
    const { filterText, setFilterText, filterStatus, setFilterStatus, refreshDependencies } = useDependencies();

    /**
     * @function handleSearchChange
     * Updates the filter text in the context.
     * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
     */
    const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterText(e.target.value);
    }, [setFilterText]);

    /**
     * @function handleStatusChange
     * Updates the filter status in the context.
     * @param {React.ChangeEvent<HTMLSelectElement>} e - The select change event.
     */
    const handleStatusChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterStatus(e.target.value as DependencyStatus | 'all');
    }, [setFilterStatus]);

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6" role="group" aria-label="Dependency filter and search controls">
            <input
                type="text"
                placeholder="Search dependencies by name..."
                value={filterText}
                onChange={handleSearchChange}
                className="flex-grow p-2 rounded bg-slate-800 text-slate-100 placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search dependencies by name"
            />
            <select
                value={filterStatus}
                onChange={handleStatusChange}
                className="p-2 rounded bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto cursor-pointer"
                aria-label="Filter dependencies by status"
            >
                <option value="all">All Statuses</option>
                <option value="ok">OK</option>
                <option value="outdated">Outdated</option>
                <option value="conflict">Conflict</option>
                <option value="unknown">Unknown</option>
            </select>
            <button
                onClick={refreshDependencies}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors sm:w-auto"
                aria-label="Refresh dependencies list"
            >
                Refresh
            </button>
        </div>
    );
};
FilterControls.displayName = 'FilterControls';

// --- Main Dependency Inspector Component ---
/**
 * @component DependencyInspector
 * The main component for inspecting and managing project dependencies.
 * It integrates state management, filtering, and detailed views.
 * This component should be wrapped by `DependencyProvider` higher up in the component tree.
 */
export const DependencyInspector: React.FC = () => {
    // Consume dependency context to access state and actions.
    const {
        dependencies,
        loading,
        error,
        selectedDependency,
        selectDependency,
        updateDependencyStatus,
        removeDependency,
        filterText,
        filterStatus,
    } = useDependencies();

    /**
     * @constant {Dependency[]} filteredDependencies
     * Memoized list of dependencies, filtered by search text and status.
     * Sorted alphabetically by name.
     */
    const filteredDependencies = React.useMemo(() => {
        return dependencies.filter(dep => {
            const matchesText = dep.name.toLowerCase().includes(filterText.toLowerCase());
            const matchesStatus = filterStatus === 'all' || dep.status === filterStatus;
            return matchesText && matchesStatus;
        }).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically for consistent display
    }, [dependencies, filterText, filterStatus]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100" role="main">
            {/* Header Section */}
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <BugAntIcon className="w-8 h-8 mr-3" aria-hidden="true" />
                    <span className="ml-0">Dependency Inspector (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1 max-w-2xl">
                    This simulated tool scans and manages project dependencies, highlighting outdated packages, conflicts, and providing resolution options.
                    It demonstrates enterprise-grade features for robust dependency management, including adding, updating, removing, filtering, and viewing details.
                </p>
            </header>

            {/* Add Dependency Form */}
            <AddDependencyForm />

            {/* Filter and Search Controls */}
            <FilterControls />

            {/* Main Content Area: Dependency List and Details Panel */}
            <div className="flex-grow flex flex-col lg:flex-row gap-6">
                {/* Dependency List Section */}
                <section className="flex-grow lg:w-2/3 flex flex-col bg-slate-900 p-4 rounded-lg shadow-inner" aria-labelledby="dependency-list-header">
                    <h2 className="text-xl font-bold text-slate-100 mb-4" id="dependency-list-header">
                        Dependencies ({filteredDependencies.length} of {dependencies.length} total)
                    </h2>
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {loading ? (
                            // Loading State
                            <div className="flex flex-col justify-center items-center h-full text-blue-400 text-lg" role="alert" aria-live="polite">
                                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-3">Loading dependencies...</p>
                            </div>
                        ) : error ? (
                            // Error State
                            <div className="flex flex-col justify-center items-center h-full text-red-400 text-lg text-center" role="alert" aria-live="assertive">
                                <p className="font-bold mb-2">Failed to load dependencies!</p>
                                <p>Error: {error}</p>
                                <p className="mt-2 text-sm">Please check your connection and try refreshing.</p>
                            </div>
                        ) : filteredDependencies.length === 0 ? (
                            // Empty State
                            <div className="flex justify-center items-center h-full text-slate-400 text-lg" role="status">
                                No dependencies found matching your criteria.
                                {filterText || filterStatus !== 'all' ? (
                                    <p className="mt-2 text-sm">Try adjusting your filters or adding a new dependency.</p>
                                ) : (
                                    <p className="mt-2 text-sm">The dependency list is empty. Add a new dependency above.</p>
                                )}
                            </div>
                        ) : (
                            // Display filtered dependencies
                            <div className="space-y-2" role="list" aria-labelledby="dependency-list-header">
                                {filteredDependencies.map(dep => (
                                    <DependencyItem
                                        key={dep.id}
                                        dependency={dep}
                                        isSelected={selectedDependency?.id === dep.id}
                                        onSelect={selectDependency}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Dependency Details Panel */}
                <DependencyDetailsPanel
                    dependency={selectedDependency}
                    onClose={() => selectDependency(null)} // Deselect on close
                    onUpdateStatus={updateDependencyStatus}
                    onRemove={removeDependency}
                />
            </div>
        </div>
    );
};
