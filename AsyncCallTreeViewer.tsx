// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

/**
 * @file app.tsx (Conceptually, this file represents a significant feature or a full page within a larger app.tsx)
 * @description
 * This file implements an enterprise-grade Async Call Tree Viewer. It visualizes a hierarchical
 * structure of asynchronous function calls, displaying their names and durations.
 *
 * Key Features:
 * - **Data Visualization:** Renders a collapsible tree structure of async calls.
 * - **Interactive Nodes:** Expand/collapse individual nodes, select nodes to view details.
 * - **Filtering/Searching:** Allows users to filter the tree nodes by name.
 * - **Sorting:** Provides options to sort children nodes by name or duration in ascending/descending order.
 * - **Global Controls:** Buttons to expand or collapse all nodes in the tree.
 * - **Node Details Panel:** Displays detailed information for a selected node.
 * - **Loading & Error States:** Simulates asynchronous data fetching with proper loading and error handling UI.
 * - **Performance Optimization:** Uses React.memo, useCallback, and useMemo to prevent unnecessary re-renders.
 * - **Accessibility:** Incorporates ARIA attributes for improved screen reader support.
 * - **Type Safety:** Fully typed with TypeScript interfaces for data structures and component props.
 * - **State Management:** Utilizes React's Context API for global tree settings (e.g., selected node, expand/collapse state).
 * - **Error Boundaries:** Implements a generic error boundary for robust UI.
 * - **Responsive Styling:** Uses Tailwind CSS for a modern, responsive design.
 *
 * This component is designed to be self-contained and easily integrated into a larger React application.
 * It demonstrates best practices for building complex, interactive data visualization tools.
 */

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { ChartBarIcon, SearchIcon, ArrowUpIcon, ArrowDownIcon, RefreshIcon, XCircleIcon, InformationCircleIcon } from '../icons/FeatureIcons.tsx'; // Assuming FeatureIcons.tsx provides these icons

// --- Type Definitions ---
/**
 * @interface AsyncTreeNode
 * @description Defines the structure of a single node in the asynchronous call tree.
 */
export interface AsyncTreeNode {
    id: string; // Unique identifier for the node
    name: string;
    duration: number; // Duration in milliseconds
    startTime?: number; // Optional: When the call started relative to the root
    endTime?: number;   // Optional: When the call ended relative to the root
    status?: 'success' | 'failure' | 'pending'; // Optional: Status of the call
    children: AsyncTreeNode[];
}

/**
 * @interface TreeSettings
 * @description Defines the global settings and state managed by the TreeSettingsContext.
 */
interface TreeSettings {
    expandAll: boolean;
    setExpandAll: (expand: boolean) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    sortCriterion: 'name' | 'duration';
    setSortCriterion: (criterion: 'name' | 'duration') => void;
    sortOrder: 'asc' | 'desc';
    setSortOrder: (order: 'asc' | 'desc') => void;
    selectedNodeId: string | null;
    setSelectedNodeId: (id: string | null) => void;
}

/**
 * @interface TreeNodeProps
 * @description Props for the TreeNode component.
 */
interface TreeNodeProps {
    node: AsyncTreeNode;
    level: number;
    parentIsExpanded: boolean; // Indicates if the parent node is expanded
}

/**
 * @interface ErrorBoundaryProps
 * @description Props for the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * @interface ErrorBoundaryState
 * @description State for the ErrorBoundary component.
 */
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * @interface AsyncCallTreeViewerProps
 * @description Props for the AsyncCallTreeViewer component.
 */
interface AsyncCallTreeViewerProps {
    // In a real app, this might accept an API endpoint or initial data.
    // For this demonstration, we'll use a simulated fetch.
    initialData?: AsyncTreeNode;
}

// --- Context API ---
/**
 * @context TreeSettingsContext
 * @description Provides global settings and state for the async call tree,
 * allowing child components to access and modify them without prop drilling.
 */
export const TreeSettingsContext = createContext<TreeSettings | undefined>(undefined);

/**
 * @function useTreeSettings
 * @description Custom hook to easily consume the TreeSettingsContext.
 * @returns {TreeSettings} The current tree settings.
 * @throws {Error} If used outside of a TreeSettingsContext.Provider.
 */
export const useTreeSettings = (): TreeSettings => {
    const context = useContext(TreeSettingsContext);
    if (context === undefined) {
        throw new Error('useTreeSettings must be used within a TreeSettingsProvider');
    }
    return context;
};

// --- Error Boundary Component ---
/**
 * @class ErrorBoundary
 * @description A reusable React error boundary component to catch JavaScript errors
 * anywhere in their child component tree, log those errors, and display a fallback UI.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render shows the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        // For enterprise applications, integrate with Sentry, Bugsnag, etc.
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                this.props.fallback || (
                    <div className="flex flex-col items-center justify-center p-8 bg-red-900 text-red-200 rounded-lg shadow-lg">
                        <XCircleIcon className="w-12 h-12 mb-4 text-red-400" />
                        <h2 className="text-xl font-semibold mb-2">Something went wrong.</h2>
                        <p className="text-sm text-red-300 mb-4">
                            We're sorry for the inconvenience. Please try refreshing the page.
                        </p>
                        {this.state.error && (
                            <details className="mt-4 text-xs text-red-400 max-h-32 overflow-y-auto w-full p-2 bg-red-800 rounded">
                                <summary className="cursor-pointer">Error Details</summary>
                                <pre className="whitespace-pre-wrap break-all text-red-300">
                                    {this.state.error.message}
                                    <br />
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium"
                        >
                            Reload Page
                        </button>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}

// --- Utility Functions ---

/**
 * @function generateUniqueId
 * @description Generates a simple unique ID for tree nodes.
 * @returns {string} A unique ID.
 */
const generateUniqueId = (): string => Math.random().toString(36).substr(2, 9);

/**
 * @function addIdsToTree
 * @description Recursively adds unique IDs to each node in the tree if they don't exist.
 * @param {AsyncTreeNode} node - The current node to process.
 * @returns {AsyncTreeNode} The node with an ID.
 */
export const addIdsToTree = (node: AsyncTreeNode): AsyncTreeNode => {
    return {
        ...node,
        id: node.id || generateUniqueId(),
        children: node.children ? node.children.map(addIdsToTree) : [],
    };
};

/**
 * @function filterTreeNodes
 * @description Recursively filters the tree nodes based on a search term.
 * A node is included if its name matches the search term, or if any of its
 * children match the search term.
 * @param {AsyncTreeNode} node - The current node to filter.
 * @param {string} searchTerm - The term to search for (case-insensitive).
 * @returns {AsyncTreeNode | null} The filtered node, or null if it doesn't match and has no matching children.
 */
export const filterTreeNodes = (node: AsyncTreeNode, searchTerm: string): AsyncTreeNode | null => {
    if (!searchTerm) {
        return node; // If no search term, return node as is
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const matchesSelf = node.name.toLowerCase().includes(lowerCaseSearchTerm);

    const filteredChildren = node.children
        .map(child => filterTreeNodes(child, searchTerm))
        .filter(child => child !== null) as AsyncTreeNode[];

    if (matchesSelf || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
    }

    return null;
};

/**
 * @function sortTreeNodes
 * @description Recursively sorts the children of tree nodes based on a criterion and order.
 * @param {AsyncTreeNode} node - The current node whose children need to be sorted.
 * @param {'name' | 'duration'} criterion - The property to sort by.
 * @param {'asc' | 'desc'} order - The sort order.
 * @returns {AsyncTreeNode} The node with sorted children.
 */
export const sortTreeNodes = (node: AsyncTreeNode, criterion: 'name' | 'duration', order: 'asc' | 'desc'): AsyncTreeNode => {
    if (!node.children || node.children.length === 0) {
        return node;
    }

    const sortedChildren = [...node.children].sort((a, b) => {
        let valA, valB;
        if (criterion === 'name') {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
        } else {
            valA = a.duration;
            valB = b.duration;
        }

        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });

    return {
        ...node,
        children: sortedChildren.map(child => sortTreeNodes(child, criterion, order)),
    };
};

/**
 * @function findNodeById
 * @description Recursively finds a node in the tree by its unique ID.
 * @param {AsyncTreeNode} node - The current node to search.
 * @param {string} id - The ID of the node to find.
 * @returns {AsyncTreeNode | null} The found node, or null if not found.
 */
export const findNodeById = (node: AsyncTreeNode | null, id: string): AsyncTreeNode | null => {
    if (!node) return null;
    if (node.id === id) return node;
    for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
    }
    return null;
};


// --- Mock Data (Enhanced) ---
const rawMockAsyncTree: Omit<AsyncTreeNode, 'id'> = { // Omit 'id' as we'll generate them
    name: 'startApp',
    duration: 500,
    startTime: 0,
    endTime: 500,
    status: 'success',
    children: [
        {
            name: 'fetchUserData',
            duration: 300,
            startTime: 50,
            endTime: 350,
            status: 'success',
            children: [
                { name: 'authenticate', duration: 100, startTime: 60, endTime: 160, status: 'success', children: [] },
                { name: 'fetchProfile', duration: 150, startTime: 180, endTime: 330, status: 'success', children: [] },
                { name: 'logActivity', duration: 50, startTime: 200, endTime: 250, status: 'failure', children: [] },
            ],
        },
        {
            name: 'loadInitialAssets',
            duration: 450,
            startTime: 10,
            endTime: 460,
            status: 'success',
            children: [
                { name: 'loadImage.png', duration: 200, startTime: 20, endTime: 220, status: 'success', children: [] },
                { name: 'loadScript.js', duration: 250, startTime: 210, endTime: 460, status: 'success', children: [] },
                { name: 'initAnalytics', duration: 80, startTime: 300, endTime: 380, status: 'pending', children: [] },
            ],
        },
        {
            name: 'initializeDatabaseConnection',
            duration: 120,
            startTime: 400,
            endTime: 520, // Note: can exceed parent duration if parallel
            status: 'success',
            children: [],
        },
        {
            name: 'renderInitialUI',
            duration: 100,
            startTime: 400,
            endTime: 500,
            status: 'success',
            children: [],
        },
    ],
};

// --- Component: TreeNode ---
/**
 * @component TreeNode
 * @description Displays a single node in the asynchronous call tree, with expand/collapse functionality.
 * Integrates with global settings for expansion, sorting, and selection.
 */
export const TreeNode: React.FC<TreeNodeProps> = React.memo(({ node, level, parentIsExpanded }) => {
    const { expandAll, selectedNodeId, setSelectedNodeId, sortCriterion, sortOrder } = useTreeSettings();
    const [isNodeOpen, setIsNodeOpen] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    // Effect to synchronize node's open state with global expandAll setting
    useEffect(() => {
        setIsNodeOpen(expandAll);
    }, [expandAll]);

    const handleToggle = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        setIsNodeOpen(prev => !prev);
    }, []);

    const handleNodeClick = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        setSelectedNodeId(node.id === selectedNodeId ? null : node.id); // Toggle selection
    }, [node.id, selectedNodeId, setSelectedNodeId]);

    const isSelected = selectedNodeId === node.id;

    const statusClasses = {
        'success': 'text-green-500',
        'failure': 'text-red-500',
        'pending': 'text-yellow-500',
    };

    // Apply sorting to children if needed, only when children are visible
    const sortedChildren = useMemo(() => {
        if (!hasChildren) return [];
        return sortTreeNodes({ ...node, children: node.children }, sortCriterion, sortOrder).children;
    }, [node.children, sortCriterion, sortOrder, hasChildren]);

    if (!parentIsExpanded && level > 0) { // Only render if parent is expanded, or it's the root node (level 0)
        return null;
    }

    return (
        <div role="treeitem" aria-level={level + 1} aria-expanded={isNodeOpen} className="group">
            <div
                className={`flex items-center p-2 rounded-md transition-colors duration-150 cursor-pointer
                            ${isSelected ? 'bg-blue-700 text-white shadow-lg' : 'hover:bg-slate-800'}
                            ${selectedNodeId !== null && !isSelected ? 'opacity-70 hover:opacity-100' : ''}`}
                style={{ marginLeft: `${level * 20}px` }}
                onClick={handleNodeClick}
                tabIndex={0} // Make div focusable for keyboard navigation
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleNodeClick(e as any); // Type assertion for event compatibility
                    }
                    if (e.key === 'ArrowLeft' && isNodeOpen && hasChildren) {
                        setIsNodeOpen(false);
                    } else if (e.key === 'ArrowRight' && !isNodeOpen && hasChildren) {
                        setIsNodeOpen(true);
                    }
                }}
            >
                {hasChildren ? (
                    <button
                        onClick={handleToggle}
                        className={`mr-2 w-4 h-4 flex items-center justify-center transition-transform duration-150 ${isNodeOpen ? 'rotate-90' : ''} text-slate-500 hover:text-white`}
                        aria-label={isNodeOpen ? 'Collapse' : 'Expand'}
                        tabIndex={-1} // Prevent button from being tabbed to separately from the node div
                    >
                       <span className="text-xl leading-none">{isNodeOpen ? 'â–¼' : 'â–º'}</span>
                    </button>
                ) : (
                    <span className="mr-2 w-4 h-4 inline-block"></span> // Placeholder for alignment
                )}
                 <div className="flex-grow flex items-center justify-between font-medium">
                    <span className={`${isSelected ? 'text-white' : 'text-slate-200'}`}>{node.name}</span>
                    <div className="flex items-center text-xs">
                        {node.status && (
                            <span className={`mr-2 px-2 py-0.5 rounded-full capitalize ${statusClasses[node.status]} bg-opacity-20`}
                                  style={{ backgroundColor: `rgba(${node.status === 'success' ? '34, 197, 94' : node.status === 'failure' ? '239, 68, 68' : '234, 179, 8' }, 0.2)` }}>
                                {node.status}
                            </span>
                        )}
                        <span className={`${isSelected ? 'text-blue-200' : 'text-cyan-400'} font-semibold`}>
                            {node.duration}ms
                        </span>
                    </div>
                </div>
            </div>
            {(isNodeOpen || expandAll) && hasChildren && (
                <div role="group">
                    {sortedChildren.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            parentIsExpanded={isNodeOpen || expandAll}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

// --- Component: NodeDetailPanel ---
/**
 * @component NodeDetailPanel
 * @description Displays detailed information about a selected async tree node.
 */
export const NodeDetailPanel: React.FC<{ node: AsyncTreeNode }> = React.memo(({ node }) => {
    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-inner overflow-y-auto max-h-full">
            <h2 className="text-xl font-bold text-blue-300 mb-4 flex items-center">
                <InformationCircleIcon className="w-6 h-6 mr-2" />
                Node Details: <span className="text-white ml-2">{node.name}</span>
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300">
                <p><strong className="text-slate-100">ID:</strong></p><p>{node.id}</p>
                <p><strong className="text-slate-100">Name:</strong></p><p>{node.name}</p>
                <p><strong className="text-slate-100">Duration:</strong></p><p><span className="text-cyan-400 font-semibold">{node.duration}ms</span></p>
                {node.startTime !== undefined && <p><strong className="text-slate-100">Start Time:</strong></p>}
                {node.startTime !== undefined && <p>{node.startTime}ms</p>}
                {node.endTime !== undefined && <p><strong className="text-slate-100">End Time:</strong></p>}
                {node.endTime !== undefined && <p>{node.endTime}ms</p>}
                {node.status && <p><strong className="text-slate-100">Status:</strong></p>}
                {node.status && <p className={`capitalize ${node.status === 'success' ? 'text-green-400' : node.status === 'failure' ? 'text-red-400' : 'text-yellow-400'}`}>{node.status}</p>}
                <p><strong className="text-slate-100">Children:</strong></p><p>{node.children?.length || 0}</p>
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mt-6 mb-3">Raw Data:</h3>
            <pre className="bg-slate-900 p-3 rounded-md text-xs text-slate-400 overflow-x-auto">
                <code>{JSON.stringify(node, null, 2)}</code>
            </pre>
        </div>
    );
});

// --- Component: AsyncCallTreeViewer (Main Component) ---
/**
 * @component AsyncCallTreeViewer
 * @description The main component for displaying and interacting with an asynchronous call tree.
 * It integrates filtering, sorting, global expansion, and a detail panel.
 */
export const AsyncCallTreeViewer: React.FC<AsyncCallTreeViewerProps> = ({ initialData }) => {
    const [treeData, setTreeData] = useState<AsyncTreeNode | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Global tree settings
    const [expandAll, setExpandAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortCriterion, setSortCriterion] = useState<'name' | 'duration'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Simulate API call to fetch tree data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 800));
                // Add unique IDs to all nodes
                const dataWithIds = addIdsToTree(initialData || rawMockAsyncTree);
                setTreeData(dataWithIds);
                // Pre-select root node for initial detail view
                setSelectedNodeId(dataWithIds.id);
            } catch (err) {
                console.error("Failed to fetch tree data:", err);
                setError("Failed to load async call tree data. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [initialData]);

    // Memoize filtered and sorted tree data for performance
    const processedTreeData = useMemo(() => {
        if (!treeData) return null;
        let currentTree = { ...treeData };
        currentTree = sortTreeNodes(currentTree, sortCriterion, sortOrder);
        const filtered = filterTreeNodes(currentTree, searchTerm);
        return filtered;
    }, [treeData, searchTerm, sortCriterion, sortOrder]);

    // Find the selected node for the detail panel
    const selectedNode = useMemo(() => {
        if (!processedTreeData || !selectedNodeId) return null;
        return findNodeById(processedTreeData, selectedNodeId);
    }, [processedTreeData, selectedNodeId]);

    const treeSettings: TreeSettings = useMemo(() => ({
        expandAll,
        setExpandAll,
        searchTerm,
        setSearchTerm,
        sortCriterion,
        setSortCriterion,
        sortOrder,
        setSortOrder,
        selectedNodeId,
        setSelectedNodeId,
    }), [expandAll, searchTerm, sortCriterion, sortOrder, selectedNodeId]);

    return (
        <ErrorBoundary>
            <TreeSettingsContext.Provider value={treeSettings}>
                <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 font-sans">
                    <header className="mb-6 pb-4 border-b border-slate-700">
                        <h1 className="text-4xl font-extrabold text-blue-400 flex items-center">
                            <ChartBarIcon className="w-10 h-10 mr-4" />
                            <span>Async Call Tree Explorer</span>
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">
                            Interactive visualization and analysis of asynchronous function calls.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search nodes by name..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-800 text-white rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="Search async call nodes"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>

                        {/* Sorting Controls */}
                        <div className="flex space-x-4">
                            <select
                                className="flex-grow bg-slate-800 text-white p-2 rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                value={sortCriterion}
                                onChange={(e) => setSortCriterion(e.target.value as 'name' | 'duration')}
                                aria-label="Sort by criterion"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="duration">Sort by Duration</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-md border border-slate-700 transition-colors duration-200 flex items-center justify-center w-12"
                                aria-label={`Sort order: ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                            >
                                {sortOrder === 'asc' ? <ArrowUpIcon className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Global Expand/Collapse & Refresh */}
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setExpandAll(true)}
                                className="flex-grow bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
                                aria-label="Expand all nodes"
                            >
                                Expand All
                            </button>
                            <button
                                onClick={() => setExpandAll(false)}
                                className="flex-grow bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
                                aria-label="Collapse all nodes"
                            >
                                Collapse All
                            </button>
                            <button
                                onClick={() => {
                                    // Trigger re-fetch/re-initialization
                                    setTreeData(null);
                                    setError(null);
                                    setIsLoading(true);
                                    // Simulate refetch, ensuring IDs are regenerated
                                    setTimeout(() => {
                                        const newData = addIdsToTree(rawMockAsyncTree);
                                        setTreeData(newData);
                                        setSelectedNodeId(newData.id);
                                        setIsLoading(false);
                                    }, 500);
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-md border border-slate-700 transition-colors duration-200 flex items-center justify-center w-12"
                                aria-label="Refresh data"
                            >
                                <RefreshIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                        {/* Tree Viewer Panel */}
                        <div className="lg:col-span-2 flex flex-col bg-slate-900 p-4 rounded-lg shadow-xl font-mono text-sm overflow-hidden">
                            <h2 className="text-xl font-semibold text-slate-200 mb-4">Call Tree</h2>
                            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                                {isLoading && (
                                    <div className="flex items-center justify-center h-full text-blue-400">
                                        <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Loading async tree data...
                                    </div>
                                )}
                                {error && (
                                    <div className="flex items-center justify-center h-full text-red-400 bg-red-900 bg-opacity-20 p-4 rounded-md">
                                        <XCircleIcon className="w-6 h-6 mr-2" />
                                        <span>Error: {error}</span>
                                    </div>
                                )}
                                {!isLoading && !error && (!processedTreeData ? (
                                    <div className="flex items-center justify-center h-full text-slate-500">
                                        No async call data available or filtered out.
                                    </div>
                                ) : (
                                    <div role="tree" aria-label="Async Call Tree">
                                        <TreeNode node={processedTreeData} level={0} parentIsExpanded={true} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Node Details Panel */}
                        <div className="flex flex-col bg-slate-900 p-0 rounded-lg shadow-xl overflow-hidden">
                            {selectedNode ? (
                                <NodeDetailPanel node={selectedNode} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-6 text-slate-400 bg-slate-800 rounded-lg">
                                    <InformationCircleIcon className="w-12 h-12 mb-4 text-slate-500" />
                                    <p className="text-lg font-medium mb-2">Select a Node</p>
                                    <p className="text-center text-sm">
                                        Click on any async call node in the tree to view its detailed information here.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </TreeSettingsContext.Provider>
        </ErrorBoundary>
    );
};