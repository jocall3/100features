// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useMemo, useCallback } from 'react';
import { ChartBarIcon, FolderOpenIcon, FolderClosedIcon, DocumentIcon, SearchIcon } from '../icons/FeatureIcons.tsx';

// --- README-style Comment ---
/**
 * @fileoverview This module provides a File Tree Heatmap component that visualizes
 * file and folder activity within a mock codebase structure.
 *
 * The `FileTreeHeatmap` component displays a hierarchical view of files and folders,
 * where each node's background color intensity (from red for "hot" to green for "cold")
 * represents its activity level.
 *
 * Features include:
 * - **Hierarchical Tree View**: Displays nested files and folders.
 * - **Activity Heatmap**: Visualizes activity levels using a color gradient.
 * - **Folder Expansion/Collapse**: Users can interactively expand and collapse folders.
 * - **Search/Filter**: Allows users to search for files and folders by name,
 *   dynamically filtering and highlighting matching nodes.
 * - **Responsive Design**: Uses Tailwind CSS for a responsive layout.
 * - **Accessibility**: Includes ARIA attributes and keyboard navigation support.
 * - **Performance Optimizations**: Utilizes `React.memo`, `useCallback`, and `useMemo`
 *   to minimize unnecessary re-renders.
 * - **TypeScript**: Fully typed for props and state for better maintainability and error checking.
 * - **Legend**: A clear legend explains the heatmap color scheme.
 *
 * This component is designed to be production-ready, maintainable, and scalable as part
 * of a larger enterprise-grade React application.
 */

// --- Types ---

/**
 * @interface FileNodeData
 * @description Represents a single file or folder node in the file tree.
 * @property {string} name - The name of the file or folder.
 * @property {'file' | 'folder'} type - The type of the node (file or folder).
 * @property {number} activity - A numerical value (0-100) indicating the activity level.
 * @property {FileNodeData[]} [children] - An optional array of child nodes if it's a folder.
 */
export interface FileNodeData {
  name: string;
  type: 'file' | 'folder';
  activity: number; // 0-100
  children?: FileNodeData[];
}

/**
 * @interface FileNodeProps
 * @description Props for the FileNode component.
 * @property {FileNodeData} node - The data for the current file or folder node.
 * @property {number} level - The nesting level of the node in the tree (0 for root).
 * @property {Set<string>} expandedNodePaths - A set of unique paths for currently expanded folders.
 * @property {(nodePath: string) => void} onToggleExpand - Callback to toggle the expansion state of a folder.
 * @property {string} searchTerm - The current search term to highlight matching node names.
 * @property {string} parentPath - The unique path of the parent node, used to construct this node's full path.
 */
interface FileNodeProps {
  node: FileNodeData;
  level: number;
  expandedNodePaths: Set<string>;
  onToggleExpand: (nodePath: string) => void;
  searchTerm: string;
  parentPath: string;
}

// --- Mock Data ---

/**
 * @constant mockFileTree
 * @description A mock file tree structure used for demonstration purposes.
 * Each node has a name, type, activity level, and optionally children.
 */
export const mockFileTree: FileNodeData = {
  name: 'src',
  type: 'folder',
  activity: 100, // Aggregate activity for the folder
  children: [
    { name: 'index.ts', type: 'file', activity: 10 },
    {
      name: 'components',
      type: 'folder',
      activity: 80,
      children: [
        { name: 'Button.tsx', type: 'file', activity: 75 },
        { name: 'Input.tsx', type: 'file', activity: 25 },
        { name: 'Sidebar.tsx', type: 'file', activity: 80 },
        { name: 'Header.tsx', type: 'file', activity: 10 },
      ],
    },
    {
      name: 'services',
      type: 'folder',
      activity: 50,
      children: [{ name: 'api.ts', type: 'file', activity: 50 }],
    },
    {
      name: 'utils',
      type: 'folder',
      activity: 90,
      children: [
        { name: 'helpers.ts', type: 'file', activity: 90 },
        { name: 'validators.ts', type: 'file', activity: 70 },
      ],
    },
    { name: 'App.tsx', type: 'file', activity: 95 },
  ],
};

// --- Helper Functions ---

/**
 * @function filterTree
 * @description Recursively filters a file tree based on a search term.
 * A node is included if its name matches the search term, or if it's a folder
 * that contains children matching the search term.
 * @param {FileNodeData} node - The current node to filter.
 * @param {string} searchTerm - The term to search for (case-insensitive).
 * @returns {FileNodeData | null} The filtered node, or null if it doesn't match and has no matching children.
 */
export const filterTree = (node: FileNodeData, searchTerm: string): FileNodeData | null => {
    if (!searchTerm) {
        return node; // If no search term, return the node as is
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const matchesNodeName = node.name.toLowerCase().includes(lowerCaseSearchTerm);

    if (node.type === 'file') {
        return matchesNodeName ? node : null;
    }

    // It's a folder
    const filteredChildren = node.children
        ?.map(child => filterTree(child, searchTerm))
        .filter((child): child is FileNodeData => child !== null) || [];

    // A folder is included if its name matches OR if any of its children match
    if (matchesNodeName || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
    }

    return null;
};

// --- Component: HeatmapLegend ---

/**
 * @component HeatmapLegend
 * @description Displays a legend for the heatmap colors, explaining activity levels.
 * It provides a visual gradient from red (high activity) to green (low activity).
 */
export const HeatmapLegend: React.FC = () => {
    return (
        <div className="p-3 bg-slate-800 rounded-lg text-xs text-slate-400 mt-4">
            <h3 className="font-bold text-slate-200 mb-2">Activity Legend</h3>
            <div className="flex justify-between items-center mb-1">
                <span className="text-red-400">High Activity (Hot)</span>
                <span className="text-green-400">Low Activity (Cold)</span>
            </div>
            <div className="h-2 w-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" aria-hidden="true"></div>
            <div className="flex justify-between mt-1">
                <span>100%</span>
                <span>0%</span>
            </div>
        </div>
    );
};

// --- Component: FileNode ---

/**
 * @component FileNode
 * @description Renders an individual file or folder node in the file tree.
 * It handles displaying the node name, activity heatmap, icons, and toggling folder expansion.
 * Uses React.memo for performance optimization to prevent unnecessary re-renders when
 * parent components update but this node's props remain the same.
 */
const FileNode: React.FC<FileNodeProps> = React.memo(({ node, level, expandedNodePaths, onToggleExpand, searchTerm, parentPath }) => {
    const isFolder = node.type === 'folder';
    const hasChildren = isFolder && node.children && node.children.length > 0;
    const nodePath = `${parentPath}/${node.name}`; // Unique path for this node
    const isExpanded = expandedNodePaths.has(nodePath);
    const displayChildren = isFolder && hasChildren && isExpanded;

    // Calculate color based on activity (0-100)
    const colorIntensity = Math.min(100, Math.max(0, node.activity)) / 100; // Normalize to 0-1
    // HSL: Hue=0(red) for 100% activity, Hue=120(green) for 0% activity.
    const hue = 120 * (1 - colorIntensity); // activity 0 -> 120 (green), activity 100 -> 0 (red)
    const color = `hsl(${hue}, 80%, 50%)`;

    /**
     * @function handleNodeClick
     * @description Toggles the expansion state of the current folder node.
     */
    const handleNodeClick = useCallback(() => {
        if (isFolder) {
            onToggleExpand(nodePath);
        }
    }, [isFolder, onToggleExpand, nodePath]);

    const nodeName = node.name;
    const lowerCaseNodeName = nodeName.toLowerCase();
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const highlightIndex = lowerCaseSearchTerm && lowerCaseNodeName.indexOf(lowerCaseSearchTerm);
    
    // Highlight the search term within the node name
    const highlightedName = (highlightIndex !== -1 && searchTerm.length > 0) ? (
        <>
            {nodeName.substring(0, highlightIndex)}
            <span className="bg-yellow-300 text-black px-0.5 rounded-sm">{nodeName.substring(highlightIndex, highlightIndex + searchTerm.length)}</span>
            {nodeName.substring(highlightIndex + searchTerm.length)}
        </>
    ) : nodeName;

    return (
        <div role="treeitem" aria-expanded={isFolder ? isExpanded : undefined} className="group">
            <div
                style={{ marginLeft: `${level * 20}px` }}
                className={`flex items-center p-1 rounded-md transition-all duration-150 ease-in-out text-slate-200 ${isFolder ? 'cursor-pointer hover:bg-slate-700' : ''}`}
                onClick={handleNodeClick}
                onKeyDown={(e) => {
                    if (isFolder && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault(); // Prevent scroll on spacebar
                        handleNodeClick();
                    }
                }}
                tabIndex={isFolder ? 0 : -1} // Make folders focusable for keyboard navigation
                aria-label={`${node.name}, ${node.type}, activity ${node.activity} percent`}
            >
                <div style={{ backgroundColor: color, opacity: 0.6 }} className="w-4 h-4 rounded-sm mr-2 flex-shrink-0" title={`Activity: ${node.activity}%`}></div>
                {isFolder ? (
                    isExpanded ? <FolderOpenIcon className="w-4 h-4 mr-1 text-blue-400" aria-hidden="true" /> : <FolderClosedIcon className="w-4 h-4 mr-1 text-blue-400" aria-hidden="true" />
                ) : (
                    <DocumentIcon className="w-4 h-4 mr-1 text-slate-300" aria-hidden="true" />
                )}
                <span>{highlightedName}</span>
                <span className="ml-2 text-slate-500 text-xs" aria-label={`Activity percentage: ${node.activity}%`}>({node.activity}%)</span>
            </div>
            {displayChildren && node.children && ( // Ensure node.children exists before mapping
                <div role="group">
                    {node.children.map((child) => (
                        <FileNode
                            key={nodePath + '/' + child.name} // Unique key based on full path
                            node={child}
                            level={level + 1}
                            expandedNodePaths={expandedNodePaths}
                            onToggleExpand={onToggleExpand}
                            searchTerm={searchTerm}
                            parentPath={nodePath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

// --- Component: FileTreeHeatmap ---

/**
 * @component FileTreeHeatmap
 * @description The main component for displaying a file tree with activity heatmap visualization.
 * It includes a search bar, a legend, and manages the expansion state of folders.
 * Uses a mock data structure and allows filtering the tree by a search term.
 * It is responsive and includes accessibility features.
 */
export const FileTreeHeatmap: React.FC = () => {
    // State to manage expanded folders. Stores unique paths.
    // 'src' is expanded by default for initial visibility.
    const [expandedNodePaths, setExpandedNodePaths] = useState<Set<string>>(() => new Set<string>(['/src']));
    const [searchTerm, setSearchTerm] = useState<string>('');

    /**
     * @function handleToggleExpand
     * @description Toggles the expansion state of a folder.
     * @param {string} nodePath - The unique path of the folder to toggle.
     */
    const handleToggleExpand = useCallback((nodePath: string) => {
        setExpandedNodePaths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodePath)) {
                newSet.delete(nodePath);
            } else {
                newSet.add(nodePath);
            }
            return newSet;
        });
    }, []);

    /**
     * @function handleSearchChange
     * @description Updates the search term state and adjusts expanded nodes accordingly.
     * When a search term is active, it auto-expands all matching paths.
     * When cleared, it resets to the default expanded state (only root folder).
     * @param {React.ChangeEvent<HTMLInputElement>} e - The change event from the search input.
     */
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);

        if (newSearchTerm) {
            const newExpanded