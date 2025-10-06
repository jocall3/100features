// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ServerIcon } from '../icons/FeatureIcons.tsx';

// --- Type Definitions ---

/**
 * @interface DbRecord
 * @description Defines the structure of a single record in the database table.
 * This interface can be extended with more specific types for fields
 * if the application requires stricter data validation beyond string or number.
 */
export interface DbRecord {
    id: number;
    name: string;
    email: string;
    role: string;
    // Allows for additional string or number properties, useful for dynamic columns.
    [key: string]: string | number;
}

/**
 * @interface DbTableEditorProps
 * @description Props for the DbTableEditor component.
 * Currently empty, but can be extended to accept initial data,
 * configuration, or callbacks from a parent component, enabling greater reusability.
 */
export interface DbTableEditorProps {}

/**
 * @interface SortConfig
 * @description Defines the current sorting configuration for the table,
 * specifying which column is sorted and in what direction.
 */
interface SortConfig {
    key: keyof DbRecord;
    direction: 'ascending' | 'descending';
}

// --- Initial Data ---

/**
 * @constant initialData
 * @description Provides a default set of records to populate the table.
 * In a production environment, this data would typically be fetched
 * asynchronously from a backend API.
 */
const initialData: DbRecord[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
    { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user' },
    { id: 4, name: 'David', email: 'david@example.com', role: 'editor' },
    { id: 5, name: 'Eve', email: 'eve@example.com', role: 'user' },
];

// --- Utility Functions ---

/**
 * @function generateUniqueId
 * @description Generates a unique ID for new records based on existing records.
 * This client-side generation is for demonstration purposes.
 * In a real application, unique IDs are typically managed by the backend database.
 * @param {DbRecord[]} existingRecords - An array of existing DbRecords to determine the next available ID.
 * @returns {number} A new unique ID greater than any existing ID.
 */
const generateUniqueId = (existingRecords: DbRecord[]): number => {
    const maxId = existingRecords.reduce((max, record) => Math.max(max, record.id), 0);
    return maxId + 1;
};

// --- Component: DbTableEditor ---

/**
 * @component DbTableEditor
 * @description An enterprise-grade, interactive spreadsheet-like interface for editing database records.
 * This component demonstrates best practices for React development, including:
 * - Comprehensive TypeScript typing for props, state, and functions.
 * - Localized state management using `useState` and derived states with `useMemo`.
 * - Performance optimizations with `React.memo`, `useCallback`, and `useMemo`.
 * - Robust error and loading states for asynchronous operations (simulated saving).
 * - Enhanced user experience with filtering, sorting, adding, and deleting records.
 * - Accessibility improvements through ARIA attributes and semantic HTML.
 * - Responsive styling using Tailwind CSS.
 * - Clear documentation and comments.
 *
 * It simulates interaction with a backend by managing data in component state,
 * and includes features expected in a production-ready data editing tool.
 *
 * @param {DbTableEditorProps} props - The props for the component.
 */
export const DbTableEditor: React.FC<DbTableEditorProps> = React.memo(() => {
    // --- State Management ---
    // The core data for the table, representing database records.
    const [data, setData] = useState<DbRecord[]>(initialData);
    // State for filtering records based on user input.
    const [filterTerm, setFilterTerm] = useState<string>('');
    // State for managing current sorting configuration (column key and direction).
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    // State to indicate if a save operation is currently in progress.
    const [isSaving, setIsSaving] = useState<boolean>(false);
    // State to store any error message during a save operation.
    const [saveError, setSaveError] = useState<string | null>(null);
    // State to indicate successful completion of a save operation.
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

    /**
     * @constant headers
     * @description Dynamically derives table headers from the keys of the first data record.
     * `useMemo` is used to cache this computation, re-running only when `data` changes.
     * The 'id' field is explicitly excluded from being a directly editable column in the UI.
     */
    const headers = useMemo(() => {
        if (data.length === 0) return [];
        return Object.keys(data[0]).filter(key => key !== 'id') as (keyof DbRecord)[];
    }, [data]);

    // --- Data Transformation (Filtering and Sorting) ---

    /**
     * @constant filteredData
     * @description Filters the `data` based on the `filterTerm`.
     * `useMemo` ensures this re-computes only when `data` or `filterTerm` changes,
     * optimizing performance for large datasets. It performs a case-insensitive search
     * across all string values in each record.
     */
    const filteredData = useMemo(() => {
        if (!filterTerm) {
            return data;
        }
        const lowerCaseFilter = filterTerm.toLowerCase();
        return data.filter(row =>
            Object.values(row).some(value =>
                String(value).toLowerCase().includes(lowerCaseFilter)
            )
        );
    }, [data, filterTerm]);

    /**
     * @constant sortedData
     * @description Sorts the `filteredData` based on the `sortConfig`.
     * `useMemo` ensures this re-computes only when `filteredData` or `sortConfig` changes.
     * It handles ascending and descending sorts for the specified column key.
     */
    const sortedData = useMemo(() => {
        if (!sortConfig) {
            return filteredData;
        }

        return [...filteredData].sort((a, b) => {
            const aValue = String(a[sortConfig.key]);
            const bValue = String(b[sortConfig.key]);

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0; // Values are equal
        });
    }, [filteredData, sortConfig]);

    // --- Event Handlers ---

    /**
     * @function handleCellChange
     * @description Handles changes to a specific cell's value in the table.
     * This function uses `useCallback` to memoize itself, preventing unnecessary re-renders
     * of child components if it were passed down. It includes basic validation for 'name' and 'email'.
     * @param {number} rowIndex - The visible row index in the `data` array (after filtering/sorting).
     * @param {keyof DbRecord} key - The key of the column being edited (e.g., 'name', 'email').
     * @param {string} value - The new value entered by the user.
     */
    const handleCellChange = useCallback((rowIndex: number, key: keyof DbRecord, value: string) => {
        setData(prevData => {
            // Find the actual record in `prevData` corresponding to the `rowIndex` in `sortedData`.
            // This is crucial because `rowIndex` refers to the index in the *currently displayed* data.
            const recordToUpdateId = sortedData[rowIndex].id;
            const originalRecordIndex = prevData.findIndex(record => record.id === recordToUpdateId);

            if (originalRecordIndex === -1) return prevData; // Should not happen

            const newData = [...prevData];
            const recordToUpdate = { ...newData[originalRecordIndex] };

            // Basic client-side validation for demonstration
            if (key === 'name' && value.trim() === '') {
                // In a real app, this might trigger a visual error feedback for the user.
                console.warn(`Validation Error: Name for ID ${recordToUpdate.id} cannot be empty.`);
                // We might choose to prevent the update or highlight the invalid input.
                // For now, we prevent the update.
                return prevData;
            }
            if (key === 'email' && value.trim() !== '' && !/\S+@\S+\.\S+/.test(value)) {
                console.warn(`Validation Error: Invalid email format for ID ${recordToUpdate.id}.`);
                return prevData;
            }

            // Update the record with the new value.
            recordToUpdate[key] = value;
            newData[originalRecordIndex] = recordToUpdate;
            return newData;
        });
        setSaveSuccess(false); // Reset save success status on any data modification.
        setSaveError(null); // Clear any previous save errors.
    }, [sortedData]); // Dependency on `sortedData` is correct because `rowIndex` is relative to it.

    /**
     * @function handleAddRow
     * @description Adds a new empty row to the table.
     * A unique ID is generated, and default values are provided for other fields.
     * `useCallback` memoizes this function.
     */
    const handleAddRow = useCallback(() => {
        const newId = generateUniqueId(data);
        const newRow: DbRecord = {
            id: newId,
            name: '',
            email: '',
            role: 'user', // Default role for new records.
        };
        setData(prevData => [...prevData, newRow]);
        setSaveSuccess(false);
        setSaveError(null);
    }, [data]); // `data` is a dependency because `generateUniqueId` needs current data.

    /**
     * @function handleDeleteRow
     * @description Deletes a record from the table after user confirmation.
     * This provides a safeguard against accidental data loss.
     * `useCallback` memoizes this function.
     * @param {number} recordId - The `id` of the record to be deleted.
     * @param {string} recordName - The `name` of the record, used in the confirmation message.
     */
    const handleDeleteRow = useCallback((recordId: number, recordName: string) => {
        if (window.confirm(`Are you sure you want to delete the record for "${recordName}" (ID: ${recordId})? This action cannot be undone.`)) {
            setData(prevData => prevData.filter(row => row.id !== recordId));
            setSaveSuccess(false);
            setSaveError(null);
        }
    }, []);

    /**
     * @function handleFilterChange
     * @description Updates the `filterTerm` state based on user input in the filter field.
     * `useCallback` memoizes this function.
     * @param {React.ChangeEvent<HTMLInputElement>} e - The change event from the input element.
     */
    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterTerm(e.target.value);
    }, []);

    /**
     * @function handleSort
     * @description Toggles the sorting configuration for a given column key.
     * It cycles through 'ascending', 'descending', and 'no sort' states.
     * `useCallback` memoizes this function.
     * @param {keyof DbRecord} key - The column key to sort by.
     */
    const handleSort = useCallback((key: keyof DbRecord) => {
        setSortConfig(prevConfig => {
            if (!prevConfig || prevConfig.key !== key) {
                return { key, direction: 'ascending' }; // First click on a column or new column: ascending.
            }
            if (prevConfig.direction === 'ascending') {
                return { key, direction: 'descending' }; // Second click: descending.
            }
            return null; // Third click: reset sort for this column.
        });
    }, []);

    /**
     * @function handleSave
     * @description Simulates an asynchronous operation to save the current table data.
     * It sets `isSaving` to true, simulates a network delay, and then either sets `saveSuccess`
     * or `saveError`. A random error introduction adds realism for demonstration.
     * `useCallback` memoizes this function, ensuring it doesn't re-create unnecessarily.
     */
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            // Simulate an API call delay.
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Simulate a potential backend error (e.g., 10% chance).
            if (Math.random() < 0.1) {
                throw new Error('Server connectivity issue. Please try again.');
            }
            setSaveSuccess(true);
            // In a real application, the `data` would be sent to the backend here.
            console.log('Data saved successfully:', data);
        } catch (err: any) {
            // Provide user-friendly error messages.
            setSaveError(err.message || 'An unexpected error occurred while saving.');
            setSaveSuccess(false);
        } finally {
            setIsSaving(false); // Always reset saving state.
        }
    }, [data]); // `data` is a dependency to ensure the latest state is captured for saving.

    // --- Effects ---

    /**
     * @effect
     * @description Manages the auto-hiding of the save success message.
     * After a successful save, the message will disappear after 3 seconds.
     * This provides transient feedback to the user without requiring manual dismissal.
     */
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (saveSuccess) {
            timer = setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);
        }
        // Cleanup function to clear the timer if the component unmounts
        // or if `saveSuccess` changes before the timer completes.
        return () => clearTimeout(timer);
    }, [saveSuccess]); // Effect runs whenever `saveSuccess` changes.

    // --- Render Logic ---
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100">
            {/* Header Section: Title, Description, and Global Action Buttons */}
            <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                    <h1 className="text-3xl font-bold flex items-center" aria-label="Database Table Editor">
                        <ServerIcon className="w-8 h-8 text-indigo-400" />
                        <span className="ml-3">Database Table Editor (Simulation)</span>
                    </h1>
                    <p className="text-slate-400 mt-1">
                        An interactive interface for managing database records with filtering, sorting, and editing.
                    </p>
                </div>
                {/* Action Buttons for Adding and Saving */}
                <div className="flex gap-2 flex-wrap justify-end">
                    <button
                        onClick={handleAddRow}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-colors duration-200"
                        aria-label="Add new record row"
                        title="Add a new empty row to the table"
                    >
                        Add Row
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-4 py-2 ${isSaving ? 'bg-indigo-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-colors duration-200`}
                        aria-label={isSaving ? "Saving changes..." : "Save all pending changes"}
                        title={isSaving ? "Saving data to the server..." : "Click to save all current changes"}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            {/* Filter Input and Status Messages */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <input
                    type="text"
                    placeholder="Filter records (e.g., Alice, admin, example.com)..."
                    value={filterTerm}
                    onChange={handleFilterChange}
                    className="p-2 border border-slate-700 rounded-md bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-grow"
                    aria-label="Filter table records by any column"
                />
                {saveSuccess && (
                    <div
                        className="p-2 bg-green-500/20 text-green-300 rounded-md text-sm animate-fade-in whitespace-nowrap"
                        role="status"
                        aria-live="polite" // Announces changes gently to screen readers
                    >
                        Changes saved successfully!
                    </div>
                )}
                {saveError && (
                    <div
                        className="p-2 bg-red-500/20 text-red-300 rounded-md text-sm animate-fade-in whitespace-nowrap"
                        role="alert"
                        aria-live="assertive" // Announces changes immediately to screen readers
                    >
                        Error: {saveError}
                    </div>
                )}
            </div>

            {/* Main Table Container with Scrollability */}
            <div className="flex-grow overflow-auto bg-slate-900 rounded-lg shadow-xl border border-slate-800">
                <table className="w-full text-sm text-left table-auto">
                    <caption className="sr-only">Editable database records</caption>
                    <thead className="sticky top-0 bg-slate-800 shadow-md z-10">
                        <tr>
                            {/* Render dynamic headers with sorting capabilities */}
                            {headers.map(headerKey => (
                                <th
                                    key={headerKey as string}
                                    scope="col" // Semantic HTML for column headers
                                    className="p-3 font-bold text-slate-200 cursor-pointer hover:bg-slate-700 transition-colors duration-200 select-none"
                                    onClick={() => handleSort(headerKey)}
                                    // ARIA attributes for accessibility, indicating sort status
                                    aria-sort={sortConfig?.key === headerKey ? sortConfig.direction : 'none'}
                                    aria-label={`Sort by ${String(headerKey).replace(/([A-Z])/g, ' $1').trim()} column`}
                                >
                                    <div className="flex items-center">
                                        {/* Capitalize first letter of header key */}
                                        {String(headerKey).charAt(0).toUpperCase() + String(headerKey).slice(1)}
                                        {/* Sort indicator arrows */}
                                        {sortConfig?.key === headerKey && (
                                            <span className="ml-2">
                                                {sortConfig.direction === 'ascending' ? '▲' : '▼'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {/* Actions column header for delete buttons */}
                            <th scope="col" className="p-3 font-bold text-slate-200 w-20">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Conditional rendering for empty table or no filter results */}
                        {sortedData.length === 0 ? (
                            <tr>
                                <td colSpan={headers.length + 1} className="p-4 text-center text-slate-400">
                                    {filterTerm ? 'No matching records found for your filter.' : 'No records available. Click "Add Row" to get started!'}
                                </td>
                            </tr>
                        ) : (
                            // Render each data row
                            sortedData.map((row, rowIndex) => (
                                <tr key={row.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-150 group">
                                    {/* Render editable cells for each column */}
                                    {headers.map(key => (
                                        <td key={`${row.id}-${key as string}`} className="p-0">
                                            <input
                                                type="text" // All fields are text for simplicity in this example
                                                value={String(row[key])} // Ensure value is a string
                                                onChange={(e) => handleCellChange(rowIndex, key, e.target.value)}
                                                className="w-full h-full p-3 bg-transparent focus:bg-slate-800 focus:outline-none border-none text-slate-50"
                                                aria-label={`${String(key).replace(/([A-Z])/g, ' $1').trim()} for record ${row.name || `ID ${row.id}`}`}
                                            />
                                        </td>
                                    ))}
                                    {/* Delete action button for each row */}
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => handleDeleteRow(row.id, row.name || `Record ${row.id}`)}
                                            className="text-red-500 hover:text-red-700 opacity-70 group-hover:opacity-100 transition-opacity"
                                            aria-label={`Delete record for ${row.name || `ID ${row.id}`}`}
                                            title={`Delete record for ${row.name || `ID ${row.id}`}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
});