```tsx
// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

/**
 * @file EnvManager.tsx
 * @brief This file provides an enterprise-grade Environment Variable Manager component.
 * It allows users to define, manage, and switch between different sets of environment variables,
 * persisting them in local storage. It includes features like import/export, validation,
 * confirmation modals, accessibility improvements, and a Context API for broader application integration.
 *
 * @version 1.0.0
 * @author James Burvel O’Callaghan III
 * @date 2023-10-27
 */

import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { ServerIcon } from '../icons/FeatureIcons.tsx';

// --- Type Definitions ---
/**
 * @typedef {Object.<string, string>} EnvSet - Represents a collection of environment variables for a single environment.
 *                                          Key is the variable name (e.g., "API_URL"), value is its string value.
 */
type EnvSet = { [key: string]: string };

/**
 * @typedef {Object.<string, EnvSet>} AllEnvs - Represents the entire collection of environments.
 *                                            Key is the environment name (e.g., "development"), value is an EnvSet.
 */
type AllEnvs = { [name: string]: EnvSet };

// --- Utility Functions ---

/**
 * @function validateEnvName
 * @description Validates an environment name.
 * @param {string} name - The environment name to validate.
 * @returns {string | null} An error message if invalid, otherwise null.
 */
export const validateEnvName = (name: string): string | null => {
    if (!name.trim()) return 'Environment name cannot be empty.';
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) return 'Name can only contain letters, numbers, hyphens, and underscores.';
    return null;
};

/**
 * @function validateVarName
 * @description Validates an environment variable key name.
 * @param {string} name - The variable key to validate.
 * @returns {string | null} An error message if invalid, otherwise null.
 */
export const validateVarName = (name: string): string | null => {
    if (!name.trim()) return 'Variable key cannot be empty.';
    if (!/^[A-Z0-9_]+$/.test(name)) return 'Variable key must be uppercase letters, numbers, and underscores.';
    return null;
};

// --- Utility Hooks & Components ---

/**
 * @function useLocalStorage
 * @template T
 * @description A custom React hook to persist state in localStorage, providing a similar API to `useState`.
 * @param {string} key - The key for the localStorage item.
 * @param {T} initialValue - The initial value to use if no value is found in localStorage.
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>]} A tuple containing the stored value and a setter function.
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`[useLocalStorage] Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setPersistedValue: React.Dispatch<React.SetStateAction<T>> = useCallback((value) => {
        setStoredValue((prev) => {
            const valueToStore = value instanceof Function ? value(prev) : value;
            try {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (error) {
                console.error(`[useLocalStorage] Error writing to localStorage key "${key}":`, error);
            }
            return valueToStore;
        });
    }, [key]);

    return [storedValue, setPersistedValue];
}

/**
 * @interface ConfirmationModalProps
 * @property {boolean} isOpen - Controls the visibility of the modal.
 * @property {() => void} onClose - Callback function when the modal is requested to be closed.
 * @property {() => void} onConfirm - Callback function when the confirmation button is clicked.
 * @property {string} title - The title displayed in the modal header.
 * @property {React.ReactNode} message - The main message/content displayed in the modal (can be JSX).
 * @property {string} [confirmText='Confirm'] - Text for the confirmation button.
 * @property {string} [cancelText='Cancel'] - Text for the cancel button.
 * @property {boolean} [confirmDisabled=false] - If true, the confirm button will be disabled.
 */
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    confirmDisabled?: boolean;
}

/**
 * @function ConfirmationModal
 * @description A reusable modal component for confirming user actions or displaying information.
 * @param {ConfirmationModalProps} props - Props for the ConfirmationModal.
 * @returns {JSX.Element | null} The modal component or null if not open.
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = React.memo(({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmDisabled = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-sm shadow-xl border border-slate-700">
                <h3 className="text-xl font-bold text-slate-100 mb-4">{title}</h3>
                <div className="text-slate-300 mb-6">{message}</div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
                        aria-label={cancelText}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={confirmDisabled}
                        className={`px-4 py-2 rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 ${
                            confirmDisabled ? 'bg-red-800 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                        }`}
                        aria-label={confirmText}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
});

ConfirmationModal.displayName = 'ConfirmationModal';

// --- Environment Context ---

/**
 * @interface EnvContextType
 * @property {AllEnvs} envs - All defined environments and their variables.
 * @property {React.Dispatch<React.SetStateAction<AllEnvs>>} setEnvs - Setter for the environments state.
 * @property {string} activeEnv - The name of the currently active environment.
 * @property {EnvSet} currentVars - The variables of the currently active environment.
 * @property {React.Dispatch<React.SetStateAction<string>>} setActiveEnv - Setter for the active environment state.
 * @property {(envName: string) => boolean} handleAddEnv - Function to add a new environment. Returns true if added, false if validation fails or exists.
 * @property {(key: string, value: string) => void} handleUpdateVar - Function to update an environment variable.
 * @property {(key: string) => void} handleDeleteVar - Function to delete an environment variable.
 * @property {(key: string, value: string) => boolean} handleAddVar - Function to add a new environment variable. Returns true if added, false if validation fails or exists.
 * @property {(envName: string) => void} handleDeleteEnv - Function to delete an environment.
 */
interface EnvContextType {
    envs: AllEnvs;
    setEnvs: React.Dispatch<React.SetStateAction<AllEnvs>>;
    activeEnv: string;
    currentVars: EnvSet;
    setActiveEnv: React.Dispatch<React.SetStateAction<string>>;
    handleAddEnv: (envName: string) => boolean;
    handleUpdateVar: (key: string, value: string) => void;
    handleDeleteVar: (key: string) => void;
    handleAddVar: (key: string, value: string) => boolean;
    handleDeleteEnv: (envName: string) => void;
}

/**
 * @constant EnvContext
 * @description React Context for managing environment variables across components.
 */
export const EnvContext = createContext<EnvContextType | undefined>(undefined);

/**
 * @interface EnvProviderProps
 * @property {React.ReactNode} children - The child components to be rendered within the provider's scope.
 */
interface EnvProviderProps {
    children: React.ReactNode;
}

/**
 * @function EnvProvider
 * @description Provides environment variable state and management functions to its children components.
 *              It uses `useLocalStorage` to persist the environment configurations.
 * @param {EnvProviderProps} { children } - React children.
 * @returns {JSX.Element} A React Context Provider.
 */
export const EnvProvider: React.FC<EnvProviderProps> = ({ children }) => {
    const [envs, setEnvs] = useLocalStorage<AllEnvs>('devcore_envs', {
        development: {
            API_URL: 'http://localhost:3000/api',
            DEBUG_MODE: 'true',
            ANALYTICS_ENABLED: 'false'
        },
        production: {
            API_URL: 'https://api.myapp.com/v1',
            FEATURE_FLAG_A: 'true',
            STRIPE_KEY: 'pk_live_xxxx',
            LOG_LEVEL: 'info'
        },
        staging: {
            API_URL: 'https://api.staging.myapp.com/v1',
            DEBUG_MODE: 'true',
            FEATURE_FLAG_A: 'false'
        }
    });
    const [activeEnv, setActiveEnv] = useState<string>(() => Object.keys(envs)[0] || 'development');

    // Ensure activeEnv is always a valid key if envs changes or gets deleted
    useEffect(() => {
        if (Object.keys(envs).length === 0) {
            setActiveEnv(''); // No environments left
        } else if (!envs[activeEnv]) {
            setActiveEnv(Object.keys(envs)[0]); // Set to first available if activeEnv was deleted
        }
    }, [envs, activeEnv]);

    const currentVars = useMemo(() => envs[activeEnv] || {}, [envs, activeEnv]);

    const handleAddEnv = useCallback((envName: string): boolean => {
        const validationError = validateEnvName(envName);
        if (validationError) {
            alert(`Validation Error: ${validationError}`); // Consider toast/notification system
            return false;
        }
        if (envs[envName]) {
            alert(`Environment "${envName}" already exists.`); // Consider toast/notification system
            return false;
        }
        setEnvs(prev => ({ ...prev, [envName]: {} }));
        setActiveEnv(envName);
        return true;
    }, [envs, setEnvs, setActiveEnv]);

    const handleDeleteEnv = useCallback((envName: string) => {
        setEnvs(prev => {
            const newEnvs = { ...prev };
            delete newEnvs[envName];
            return newEnvs;
        });
    }, [setEnvs]);

    const handleUpdateVar = useCallback((key: string, value: string) => {
        setEnvs(prev => {
            if (!prev[activeEnv]) return prev;
            const newEnvs = { ...prev };
            newEnvs[activeEnv] = { ...newEnvs[activeEnv], [key]: value };
            return newEnvs;
        });
    }, [activeEnv, setEnvs]);

    const handleDeleteVar = useCallback((key: string) => {
        setEnvs(prev => {
            if (!prev[activeEnv]) return prev;
            const newEnvs = { ...prev };
            const newVars = { ...newEnvs[activeEnv] };
            delete newVars[key];
            newEnvs[activeEnv] = newVars;
            return newEnvs;
        });
    }, [activeEnv, setEnvs]);

    const handleAddVar = useCallback((key: string, value: string): boolean => {
        const validationError = validateVarName(key);
        if (validationError) {
            alert(`Validation Error: ${validationError}`); // Consider toast/notification system
            return false;
        }
        if (currentVars[key]) {
            alert(`Variable "${key}" already exists in "${activeEnv}".`); // Consider toast/notification system
            return false;
        }
        setEnvs(prev => {
            const newEnvs = { ...prev };
            newEnvs[activeEnv] = { ...newEnvs[activeEnv], [key]: value };
            return newEnvs;
        });
        return true;
    }, [activeEnv, currentVars, setEnvs]);

    const contextValue = useMemo(() => ({
        envs,
        setEnvs,
        activeEnv,
        setActiveEnv,
        currentVars,
        handleAddEnv,
        handleUpdateVar,
        handleDeleteVar,
        handleAddVar,
        handleDeleteEnv,
    }), [envs, setEnvs, activeEnv, setActiveEnv, currentVars, handleAddEnv, handleUpdateVar, handleDeleteVar, handleAddVar, handleDeleteEnv]);

    return <EnvContext.Provider value={contextValue}>{children}</EnvContext.Provider>;
};

EnvProvider.displayName = 'EnvProvider';

/**
 * @function useEnv
 * @description A custom hook to consume the environment context. Throws an error if not used within an EnvProvider.
 * @returns {EnvContextType} The environment context value.
 */
export const useEnv = (): EnvContextType => {
    const context = useContext(EnvContext);
    if (context === undefined) {
        throw new Error('useEnv must be used within an EnvProvider');
    }
    return context;
};

// --- Main EnvManager Component ---

/**
 * @function EnvManager
 * @description The main component for managing environment variables.
 *              It provides a UI to create, edit, delete environments and their variables,
 *              along with import/export functionality.
 *              It uses EnvProvider to manage its state, making its logic reusable.
 * @returns {JSX.Element} The EnvManager UI.
 */
export const EnvManager: React.FC = React.memo(() => {
    // Consume context for environment state and actions
    const {
        envs,
        activeEnv,
        setActiveEnv,
        currentVars,
        handleAddEnv: contextAddEnv,
        handleUpdateVar,
        handleDeleteVar: contextDeleteVar,
        handleAddVar: contextAddVar,
        handleDeleteEnv: contextDeleteEnv,
        setEnvs, // Exposing setEnvs from context for import functionality
    } = useEnv();

    // Local states for UI inputs and modals
    const [newEnvName, setNewEnvName] = useState<string>('');
    const [newKey, setNewKey] = useState<string>('');
    const [newValue, setNewValue] = useState<string>('');

    const [isEnvDeleteModalOpen, setIsEnvDeleteModalOpen] = useState<boolean>(false);
    const [envToDelete, setEnvToDelete] = useState<string>('');

    const [isVarDeleteModalOpen, setIsVarDeleteModalOpen] = useState<boolean>(false);
    const [varToDelete, setVarToDelete] = useState<string>('');

    const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
    const [importData, setImportData] = useState<string>('');
    const [isImporting, setIsImporting] = useState<boolean>(false);
    const [importError, setImportError] = useState<string | null>(null);

    const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
    const [exportData, setExportData] = useState<string>('');

    // Handlers for local UI state and actions
    const handleAddVarSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (contextAddVar(newKey, newValue)) {
            setNewKey('');
            setNewValue('');
        }
    }, [contextAddVar, newKey, newValue]);

    const handleAddEnvSubmit = useCallback(() => {
        if (contextAddEnv(newEnvName)) {
            setNewEnvName('');
        }
    }, [contextAddEnv, newEnvName]);

    const confirmDeleteEnv = useCallback(() => {
        if (envToDelete) {
            contextDeleteEnv(envToDelete);
            setIsEnvDeleteModalOpen(false);
            setEnvToDelete('');
        }
    }, [envToDelete, contextDeleteEnv]);

    const openDeleteEnvModal = useCallback((name: string) => {
        setEnvToDelete(name);
        setIsEnvDeleteModalOpen(true);
    }, []);

    const confirmDeleteVar = useCallback(() => {
        if (varToDelete) {
            contextDeleteVar(varToDelete);
            setIsVarDeleteModalOpen(false);
            setVarToDelete('');
        }
    }, [varToDelete, contextDeleteVar]);

    const openDeleteVarModal = useCallback((key: string) => {
        setVarToDelete(key);
        setIsVarDeleteModalOpen(true);
    }, []);

    const handleExport = useCallback((format: 'json' | '.env') => {
        let data: string;
        if (format === 'json') {
            data = JSON.stringify(envs, null, 2);
        } else {
            // Convert current activeEnv vars to .env format
            data = Object.entries(currentVars)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            if (activeEnv) {
                data = `# Environment: ${activeEnv}\n${data}`;
            }
        }
        setExportData(data);
        setIsExportModalOpen(true);
    }, [envs, currentVars, activeEnv]);

    const handleImport = useCallback(async () => {
        setIsImporting(true);
        setImportError(null);
        try {
            // Simulate async import for loading state demo
            await new Promise(resolve => setTimeout(resolve, 500));

            const trimmedData = importData.trim();
            if (!trimmedData) {
                throw new Error('Import data cannot be empty.');
            }

            if (trimmedData.startsWith('{') && trimmedData.endsWith('}')) {
                // Assume JSON import (AllEnvs structure)
                const importedEnvs: AllEnvs = JSON.parse(trimmedData);

                // Basic validation for imported JSON structure
                for (const envName in importedEnvs) {
                    const validationError = validateEnvName(envName);
                    if (validationError) throw new Error(`Invalid environment name in imported JSON: ${envName} (${validationError})`);
                    if (typeof importedEnvs[envName] !== 'object' || importedEnvs[envName] === null) {
                        throw new Error(`Invalid environment variables for "${envName}" in imported JSON.`);
                    }
                    for (const varKey in importedEnvs[envName]) {
                        const varValueError = validateVarName(varKey);
                        if (varValueError) throw new Error(`Invalid variable key for "${envName}": ${varKey} (${varValueError})`);
                        if (typeof importedEnvs[envName][varKey] !== 'string') {
                            throw new Error(`Invalid variable value for "${envName}.${varKey}". Must be a string.`);
                        }
                    }
                }

                setEnvs(prevEnvs => {
                    // Merge new environments and overwrite existing variable keys
                    const newEnvs = { ...prevEnvs };
                    for (const envName in importedEnvs) {
                        newEnvs[envName] = { ...newEnvs[envName], ...importedEnvs[envName] };
                    }
                    return newEnvs;
                });
            } else {
                // Assume .env format for the CURRENT activeEnv
                if (!activeEnv) {
                    throw new Error('Cannot import .env variables: no active environment selected. Please create one first or select an existing one.');
                }
                const lines = trimmedData.split('\n');
                const newVars: EnvSet = {};
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('#') || !trimmedLine) continue; // Skip comments and empty lines
                    const parts = trimmedLine.split('=');
                    if (parts.length >= 2) {
                        const key = parts[0].trim();
                        const value = parts.slice(1).join('=').trim(); // Handle values with '='
                        const validationError = validateVarName(key);
                        if (validationError) throw new Error(`Invalid variable key in .env import: ${key} (${validationError})`);
                        newVars[key] = value;
                    }
                }
                if (Object.keys(newVars).length > 0) {
                    setEnvs(prevEnvs => ({
                        ...prevEnvs,
                        [activeEnv]: { ...prevEnvs[activeEnv], ...newVars },
                    }));
                }
            }
            setIsImportModalOpen(false);
            setImportData('');
            // Use a proper toast/notification system in a real app
            alert('Import successful!');
        } catch (error: any) {
            setImportError(error.message || 'An unknown error occurred during import.');
            console.error('Import failed:', error);
        } finally {
            setIsImporting(false);
        }
    }, [importData, activeEnv, setEnvs]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100 min-h-screen">
            <header className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center mb-4 sm:mb-0" aria-label="Environment Variable Manager">
                    <ServerIcon className="w-8 h-8 text-cyan-400" />
                    <span className="ml-3">Environment Variable Manager</span>
                </h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
                        aria-label="Import Environments or Variables"
                    >
                        Import
                    </button>
                    <button
                        onClick={() => handleExport('json')}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
                        aria-label="Export All Environments as JSON"
                    >
                        Export All (JSON)
                    </button>
                    <button
                        onClick={() => handleExport('.env')}
                        disabled={!activeEnv}
                        className={`px-4 py-2 rounded-md text-sm text-white transition-colors duration-200 ${!activeEnv ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50'}`}
                        aria-label={`Export current environment (${activeEnv || 'None'}) as .env file`}
                        title={!activeEnv ? 'Select an environment to export as .env' : ''}
                    >
                        Export Active (.env)
                    </button>
                </div>
            </header>
            <p className="text-slate-400 mt-1 mb-6">Manage and switch between different environment configurations.</p>

            <div className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0">
                <aside className="lg:w-1/4 w-full bg-slate-800/50 p-4 rounded-lg flex flex-col shadow-inner border border-slate-700">
                    <h3 className="font-bold text-lg mb-2 text-slate-200">Environments</h3>
                    <ul className="space-y-2 flex-grow overflow-y-auto pr-2" role="list" aria-label="List of environments">
                        {Object.keys(envs).length === 0 ? (
                            <li className="text-slate-500 italic">No environments defined. Add one below.</li>
                        ) : (
                            Object.keys(envs).map(name => (
                                <li key={name} role="listitem" className="flex items-center justify-between group">
                                    <button
                                        onClick={() => setActiveEnv(name)}
                                        className={`flex-grow text-left px-3 py-2 rounded-md ${activeEnv === name ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'hover:bg-slate-700/50'} focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-colors duration-200`}
                                        aria-pressed={activeEnv === name}
                                        aria-label={`Switch to environment ${name}`}
                                    >
                                        {name}
                                    </button>
                                    {Object.keys(envs).length > 1 && ( // Allow deleting only if more than one env exists
                                        <button
                                            onClick={() => openDeleteEnvModal(name)}
                                            className="ml-2 p-1 text-red-400 hover:bg-red-500/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                            aria-label={`Delete environment ${name}`}
                                            title={`Delete environment ${name}`}
                                        >
                                            &times;
                                        </button>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <input
                            type="text"
                            value={newEnvName}
                            onChange={e => setNewEnvName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddEnvSubmit(); }}
                            placeholder="New environment name..."
                            className="w-full px-2 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-sm mb-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            aria-label="Input for new environment name"
                        />
                        {newEnvName && validateEnvName(newEnvName) && (
                            <p className="text-red-400 text-xs mb-2">{validateEnvName(newEnvName)}</p>
                        )}
                        <button
                            onClick={handleAddEnvSubmit}
                            disabled={!!validateEnvName(newEnvName) || envs[newEnvName.trim()]}
                            className={`w-full text-sm py-2 rounded-md transition-colors duration-200 ${
                                !!validateEnvName(newEnvName) || envs[newEnvName.trim()]
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-cyan-500/80 text-white hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50'
                            }`}
                            aria-label="Add new environment"
                        >
                            Add Environment
                        </button>
                    </div>
                </aside>
                <main className="lg:w-3/4 w-full bg-slate-900 p-6 rounded-lg flex flex-col shadow-xl border border-slate-700">
                    <h2 className="text-2xl font-bold mb-4">Editing: <span className="text-cyan-400">{activeEnv || 'No Environment Selected'}</span></h2>
                    {!activeEnv ? (
                        <p className="text-slate-500 italic text-center py-10">Select an environment from the left, or create a new one.</p>
                    ) : (
                        <>
                            <div className="flex-grow overflow-y-auto pr-2" role="list" aria-label={`Environment variables for ${activeEnv}`}>
                                <div className="space-y-3">
                                {Object.keys(currentVars).length === 0 ? (
                                    <p className="text-slate-500 italic">No variables defined for this environment. Add one below.</p>
                                ) : (
                                    Object.entries(currentVars).map(([key, value]) => (
                                        <div key={key} className="flex flex-col sm:flex-row items-center gap-2 font-mono text-sm p-2 bg-slate-800 rounded-md group">
                                            <label htmlFor={`var-${key}`} className="text-slate-400 font-semibold w-1/3 sm:w-auto min-w-[100px] flex-shrink-0">{key}=</label>
                                            <input
                                                id={`var-${key}`}
                                                type="text"
                                                value={String(value)}
                                                onChange={e => handleUpdateVar(key, e.target.value)}
                                                className="flex-grow px-2 py-1 rounded bg-slate-700 border border-slate-600 text-yellow-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                                aria-label={`Value for environment variable ${key}`}
                                            />
                                            <button
                                                onClick={() => openDeleteVarModal(key)}
                                                className="px-2 py-1 text-red-400 hover:bg-red-500/20 rounded-md transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                                aria-label={`Delete variable ${key}`}
                                                title={`Delete variable ${key}`}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))
                                )}
                                </div>
                            </div>
                            <form onSubmit={handleAddVarSubmit} className="mt-4 pt-4 border-t border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-2 font-mono text-sm">
                                <input
                                    type="text"
                                    value={newKey}
                                    onChange={e => setNewKey(e.target.value)}
                                    placeholder="NEW_VARIABLE"
                                    className="w-full sm:w-1/3 px-2 py-1.5 rounded bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    aria-label="Input for new variable key"
                                />
                                <span className="text-slate-400">=</span>
                                <input
                                    type="text"
                                    value={newValue}
                                    onChange={e => setNewValue(e.target.value)}
                                    placeholder="its_value"
                                    className="flex-grow w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    aria-label="Input for new variable value"
                                />
                                <button
                                    type="submit"
                                    disabled={!activeEnv || !!validateVarName(newKey) || currentVars[newKey.trim()]}
                                    className={`px-4 py-1.5 rounded-md text-sans w-full sm:w-auto transition-colors duration-200 ${
                                        !activeEnv || !!validateVarName(newKey) || currentVars[newKey.trim()]
                                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                            : 'bg-cyan-500/80 text-white hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50'
                                    }`}
                                    aria-label="Add new environment variable"
                                >
                                    Add
                                </button>
                            </form>
                            {newKey && validateVarName(newKey) && (
                                <p className="text-red-400 text-xs mt-2">{validateVarName(newKey)}</p>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Modals */}
            <ConfirmationModal
                isOpen={isEnvDeleteModalOpen}
                onClose={() => setIsEnvDeleteModalOpen(false)}
                onConfirm={confirmDeleteEnv}
                title="Delete Environment"
                message={`Are you sure you want to delete the environment "${envToDelete}"? This action cannot be undone.`}
                confirmText="Delete"
            />
            <ConfirmationModal
                isOpen={isVarDeleteModalOpen}
                onClose={() => setIsVarDeleteModalOpen(false)}
                onConfirm={confirmDeleteVar}
                title="Delete Variable"
                message={`Are you sure you want to delete the variable "${varToDelete}" from "${activeEnv}"? This action cannot be undone.`}
                confirmText="Delete"
            />

            {/* Import Modal */}
            <ConfirmationModal
                isOpen={isImportModalOpen}
                onClose={() => { setIsImportModalOpen(false); setImportData(''); setImportError(null); }}
                onConfirm={handleImport}
                title="Import Environments/Variables"
                message={
                    <div className="flex flex-col gap-4">
                        <p>Paste your JSON (for all environments) or .env content (for active environment) here. JSON will merge, .env will update active environment.</p>
                        <textarea
                            value={importData}
                            onChange={(e) => setImportData(e.target.value)}
                            placeholder="Paste JSON or .env content here..."
                            rows={8}
                            className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            aria-label="Import data textarea"
                        />
                        {importError && <p className="text-red-400 text-sm">{importError}</p>}
                        {isImporting && <p className="text-cyan-400 text-sm">Importing... Please wait.</p>}
                    </div>
                }
                confirmText={isImporting ? 'Importing...' : 'Import'}
                cancelText="Cancel"
                confirmDisabled={isImporting || !importData.trim()}
            />

            {/* Export Modal */}
            <ConfirmationModal
                isOpen={isExportModalOpen}
                onClose={() => { setIsExportModalOpen(false); setExportData(''); }}
                onConfirm={() => {
                    // Attempt to copy to clipboard first
                    navigator.clipboard.writeText(exportData).then(() => {
                        alert('Export data copied to clipboard!'); // Replace with a proper toast
                        setIsExportModalOpen(false);
                        setExportData('');
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                        // Fallback: provide a download link
                        const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `env_config_${activeEnv || 'all'}.${exportData.startsWith('{') ? 'json' : 'env'}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        alert('Export data copied to clipboard failed. File downloaded instead.'); // Replace with a proper toast
                        setIsExportModalOpen(false);
                        setExportData('');
                    });
                }}
                title="Export Data"
                message={
                    <div className="flex flex-col gap-4">
                        <p>Your environment data is ready. Click "Copy & Close" to copy to clipboard (download will be attempted if copy fails).</p>
                        <textarea
                            readOnly
                            value={exportData}
                            rows={10}
                            className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 text-slate-200 font-mono text-sm"
                            aria-label="Exported data textarea"
                        />
                    </div>
                }
                confirmText="Copy & Close"
                cancelText="Close"
            />
        </div>
    );
});

EnvManager.displayName = 'EnvManager';

// Export the EnvManager itself, and the Provider/Hook for external consumption.
// This allows a parent App.tsx to wrap EnvManager with EnvProvider if needed,
// or for other components to use EnvProvider/useEnv to interact with env state.
```