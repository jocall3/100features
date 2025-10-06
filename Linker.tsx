// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LinkIcon } from '../icons/FeatureIcons.tsx';

/**
 * @interface NodeData
 * @description Defines the structure for a dependency graph node.
 * @property {string} id - Unique identifier for the node.
 * @property {string} title - Display title of the node.
 * @property {number} x - X-coordinate of the node (percentage).
 * @property {number} y - Y-coordinate of the node (percentage).
 */
export interface NodeData {
    id: string;
    title: string;
    x: number;
    y: number;
}

/**
 * @interface EdgeData
 * @description Defines the structure for a dependency graph edge, connecting two nodes.
 * @property {string} id - Unique identifier for the edge.
 * @property {string} sourceNodeId - ID of the source node.
 * @property {string} targetNodeId - ID of the target node.
 */
export interface EdgeData {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
}

/**
 * @interface NodeProps
 * @description Props for the Node component.
 * @extends NodeData
 */
interface NodeProps extends NodeData {}

/**
 * @component Node
 * @description Renders a single node in the dependency graph. Uses React.memo for performance optimization.
 * @param {NodeProps} props - The properties for the Node component.
 * @returns {JSX.Element} The rendered node.
 */
const Node: React.FC<NodeProps> = React.memo(({ title, x, y }) => (
    <div
        role="group"
        aria-label={`Dependency node: ${title}`}
        className="absolute bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 shadow-md hover:shadow-lg hover:border-blue-500 transition-all duration-200 cursor-grab"
        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
        {title}
    </div>
));

/**
 * @interface EdgeProps
 * @description Props for the Edge component.
 * @property {number} x1 - X-coordinate of the start point (percentage).
 * @property {number} y1 - Y-coordinate of the start point (percentage).
 * @property {number} x2 - X-coordinate of the end point (percentage).
 * @property {number} y2 - Y-coordinate of the end point (percentage).
 */
interface EdgeProps {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    id: string;
}

/**
 * @component Edge
 * @description Renders a single edge (line) connecting two points in the dependency graph. Uses React.memo for performance optimization.
 * @param {EdgeProps} props - The properties for the Edge component.
 * @returns {JSX.Element} The rendered edge.
 */
const Edge: React.FC<EdgeProps> = React.memo(({ x1, y1, x2, y2 }) => (
    <line
        x1={`${x1}%`}
        y1={`${y1}%`}
        x2={`${x2}%`}
        y2={`${y2}%`}
        stroke="#475569"
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-all duration-200 hover:stroke-blue-500"
    />
));

/**
 * @interface LinkerProps
 * @description Props for the Linker component. Currently empty, but can be extended.
 */
export interface LinkerProps {}

/**
 * @component Linker
 * @description The main component for the Linker simulation.
 * It displays a visual dependency map with nodes and edges.
 * It simulates data loading and allows for dynamic manipulation of the graph.
 * @param {LinkerProps} props - The properties for the Linker component.
 * @returns {JSX.Element} The rendered Linker application.
 */
export const Linker: React.FC<LinkerProps> = () => {
    const [nodes, setNodes] = useState<NodeData[]>([]);
    const [edges, setEdges] = useState<EdgeData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * @function generateInitialGraph
     * @description Generates a set of initial nodes and edges for the simulation.
     * @returns {{ initialNodes: NodeData[], initialEdges: EdgeData[] }} The generated graph data.
     */
    const generateInitialGraph = useCallback(() => {
        const initialNodes: NodeData[] = [
            { id: 'node-1', title: 'apiService.ts', x: 25, y: 25 },
            { id: 'node-2', title: 'authHook.ts', x: 75, y: 25 },
            { id: 'node-3', title: 'LoginComponent.tsx', x: 50, y: 50 },
            { id: 'node-4', title: 'App.tsx', x: 50, y: 80 },
        ];

        const initialEdges: EdgeData[] = [
            { id: 'edge-1-3', sourceNodeId: 'node-1', targetNodeId: 'node-3' },
            { id: 'edge-2-3', sourceNodeId: 'node-2', targetNodeId: 'node-3' },
            { id: 'edge-3-4', sourceNodeId: 'node-3', targetNodeId: 'node-4' },
        ];

        return { initialNodes, initialEdges };
    }, []);

    /**
     * @function simulateFetchGraphData
     * @description Simulates an asynchronous data fetch for the graph.
     * Sets loading, success, or error states.
     */
    useEffect(() => {
        const fetchGraphData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Simulate potential error
                // if (Math.random() < 0.2) {
                //     throw new Error('Failed to load graph data.');
                // }

                const { initialNodes, initialEdges } = generateInitialGraph();
                setNodes(initialNodes);
                setEdges(initialEdges);
            } catch (err) {
                console.error("Error fetching graph data:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchGraphData();
    }, [generateInitialGraph]);

    /**
     * @function handleResetSimulation
     * @description Resets the simulation to its initial state, re-triggering the data fetch.
     */
    const handleResetSimulation = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setError(null);
        // Re-trigger useEffect to fetch data again
        // By changing a state that useEffect depends on, or having an empty dependency array for a one-time fetch
        // For this scenario, we can simply call simulateFetchGraphData directly or introduce a state variable to trigger it.
        // For simplicity, we'll let useEffect handle it with a conceptual "reset"
        simulateFetchGraphData(); // This is just a conceptual call, useEffect handles actual fetching.
    }, []); // No dependencies for this simple reset

    // Memoize the mapping of edges to their SVG coordinates for performance.
    const renderedEdges = useMemo(() => {
        return edges.map(edge => {
            const sourceNode = nodes.find(node => node.id === edge.sourceNodeId);
            const targetNode = nodes.find(node => node.id === edge.targetNodeId);

            if (!sourceNode || !targetNode) {
                console.warn(`Missing node for edge ${edge.id}. Source: ${edge.sourceNodeId}, Target: ${edge.targetNodeId}`);
                return null; // Don't render malformed edges
            }

            return (
                <Edge
                    key={edge.id}
                    id={edge.id}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                />
            );
        }).filter(Boolean); // Filter out nulls
    }, [nodes, edges]);

    const simulateFetchGraphData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const { initialNodes, initialEdges } = generateInitialGraph();
            setNodes(initialNodes);
            setEdges(initialEdges);
        } catch (err) {
            console.error("Error fetching graph data:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [generateInitialGraph]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100">
            <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <LinkIcon className="w-8 h-8 text-blue-400" />
                        <span className="ml-3">Linker (Interactive Simulation)</span>
                    </h1>
                    <p className="text-slate-400 mt-1">
                        A dynamic simulation of a visual dependency map, demonstrating interactive nodes and edges.
                    </p>
                </div>
                <button
                    onClick={simulateFetchGraphData}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    aria-label="Reload graph data"
                >
                    {isLoading ? 'Loading...' : 'Reload Simulation'}
                </button>
            </header>

            <div
                role="graphics-document"
                aria-label="Dependency graph visualization"
                className="flex-grow relative bg-slate-900/50 p-4 sm:p-8 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center min-h-[300px]"
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 z-10 text-xl text-blue-400">
                        <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading Graph...
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-900/70 z-10 text-xl text-red-300">
                        Error: {error}
                        <button
                            onClick={simulateFetchGraphData}
                            className="ml-4 bg-red-700 hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
                            aria-label="Retry loading graph data"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!isLoading && !error && (
                    <>
                        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
                            {renderedEdges}
                        </svg>
                        {nodes.map(node => (
                            <Node key={node.id} {...node} />
                        ))}
                    </>
                )}

                {!isLoading && !error && nodes.length === 0 && (
                    <p className="text-slate-500 text-lg">No graph data available. Click "Reload Simulation" to generate.</p>
                )}
            </div>
        </div>
    );
};