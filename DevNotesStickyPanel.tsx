// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect, useCallback, useRef, FC, ReactNode } from 'react';
import { FileCodeIcon, XIcon, PaletteIcon, PlusIcon, SearchIcon } from '../icons/FeatureIcons.tsx';

/**
 * @file DevNotesStickyPanel.tsx
 * @description
 * This file represents a self-contained, enterprise-grade React component for a Dev Notes Sticky Panel.
 * It demonstrates best practices for building a production-ready, maintainable, and scalable UI feature.
 *
 * Key Features:
 * - **Local Storage Persistence:** Notes are automatically saved and loaded from the browser's local storage.
 * - **Drag-and-Drop Functionality:** Users can freely position notes on the panel with intuitive drag-and-drop.
 * - **Dynamic Content Editing:** Note text can be edited directly within the sticky notes.
 * - **Customizable Note Colors:** Each note can have its background color changed from a predefined palette.
 * - **Confirmation Dialogs:** A robust confirmation step before deleting notes prevents accidental data loss.
 * - **Error Boundary:** A built-in error boundary ensures the application remains stable even if a child component fails.
 * - **Accessibility (A11y):** Implements ARIA attributes, keyboard navigation (e.g., Ctrl+Shift+A to add, Alt+Delete to delete), and focus management.
 * - **Performance Optimizations:** Utilizes `React.memo` for individual notes and `useCallback` for handlers to minimize unnecessary re-renders.
 * - **TypeScript:** Strong typing is applied throughout for improved code quality, maintainability, and developer experience.
 * - **Responsive Styling:** Designed with Tailwind CSS to adapt to various screen sizes.
 * - **Note Search/Filter:** Allows users to quickly find notes by searching their content.
 *
 * This component is designed to be easily integrated into a larger React application,
 * serving as a powerful and user-friendly tool for developers to jot down thoughts, tasks, and ideas.
 */

// --- TypeScript Interfaces ---

/**
 * Interface for a single sticky note.
 * @property {number} id - Unique identifier for the note.
 * @property {string} text - The content of the note.
 * @property {number} x - X-coordinate position of the note on the panel (relative to its container).
 * @property {number} y - Y-coordinate position of the note on the panel (relative to its container).
 * @property {string} color - Tailwind CSS class for the background color (e.g., 'bg-yellow-300').
 * @property {number} zIndex - Z-index for layering notes, bringing selected/dragged notes to the front.
 */
interface Note {
    id: number;
    text: string;
    x: number;
    y: number;
    color: string;
    zIndex: number;
}

/**
 * Props for the StickyNote component.
 * @property {Note} note - The note object to display.
 * @property {boolean} isDragging - True if the current note is being dragged.
 * @property {(id: number, text: string) => void} onUpdateText - Callback to update the note's text.
 * @property {(id: number) => void} onDelete - Callback to delete the note.
 * @property {(e: React.MouseEvent<HTMLDivElement>, id: number) => void} onMouseDown - Callback for mouse down event to initiate drag.
 * @property {(id: number, color: string) => void} onUpdateColor - Callback to update the note's color.
 * @property {(id: number) => void} onSetZIndex - Callback to bring the note to the front.
 */
interface StickyNoteProps {
    note: Note;
    isDragging: boolean;
    onUpdateText: (id: number, text: string) => void;
    onDelete: (id: number) => void;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>, id: number) => void;
    onUpdateColor: (id: number, color: string) => void;
    onSetZIndex: (id: number) => void;
}

/**
 * Props for the ConfirmationDialog component.
 * @property {string} message - The message to display in the dialog.
 * @property {string} [confirmText='Confirm'] - Text for the confirm button.
 * @property {string} [cancelText='Cancel'] - Text for the cancel button.
 * @property {() => void} onConfirm - Callback when the confirm button is clicked.
 * @property {() => void} onCancel - Callback when the cancel button is clicked.
 * @property {boolean} isOpen - Controls the visibility of the dialog.
 */
interface ConfirmationDialogProps {
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isOpen: boolean;
}

/**
 * Props for the ErrorBoundary component.
 * @property {ReactNode} children - The child components to render within the boundary.
 * @property {ReactNode} [fallback] - The optional UI to render when an error occurs.
 */
interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * State for the ErrorBoundary component.
 * @property {boolean} hasError - True if an error has occurred in the children.
 * @property {Error | null} error - The error object, if any.
 * @property {React.ErrorInfo | null} errorInfo - Additional error info, if any.
 */
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

// --- Hooks ---

/**
 * Custom hook for persisting state to local storage.
 * @template T - The type of the state value.
 * @param {string} key - The key under which to store the value in local storage.
 * @param {T} initialValue - The initial value for the state if nothing is found in local storage.
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>]} A tuple containing the stored value and a setter function.
 */
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Use useCallback to memoize the setValue function, preventing unnecessary re-renders
    const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`Error writing to localStorage key "${key}":`, error);
        }
    }, [key, storedValue]); // `storedValue` in dependency array to ensure function updates with latest state

    return [storedValue, setValue];
};


// --- Constants & Utilities ---

/**
 * Array of predefined Tailwind CSS color classes for notes.
 */
const colors = ['bg-yellow-300', 'bg-green-300', 'bg-blue-300', 'bg-pink-300', 'bg-purple-300', 'bg-indigo-300', 'bg-red-300'];

/**
 * Helper function to generate a unique ID based on the current timestamp.
 * For production applications requiring extremely high uniqueness, a UUID library might be preferred.
 * @returns {number} A unique timestamp-based ID.
 */
const generateId = (): number => Date.now();

// --- Component: ConfirmationDialog ---

/**
 * @component ConfirmationDialog
 * @description A reusable modal dialog component for confirming user actions, such as deletion.
 * Styled with Tailwind CSS for a consistent look and feel.
 * @param {ConfirmationDialogProps} props - Props for the ConfirmationDialog component.
 * @exports ConfirmationDialog
 */
export const ConfirmationDialog: FC<ConfirmationDialogProps> = ({
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isOpen,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 max-w-sm w-full border border-slate-700">
                <p id="dialog-description" className="text-lg text-slate-100 mb-6 text-center">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                        aria-label={cancelText}
                        autoFocus // Focus on cancel by default for safer UX
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                        aria-label={confirmText}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Component: ErrorBoundary ---

/**
 * @component ErrorBoundary
 * @description A React component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * Implemented as a class component as `getDerivedStateFromError` and `componentDidCatch` are not available in hooks.
 * @param {ErrorBoundaryProps} props - Props for the ErrorBoundary component.
 * @exports ErrorBoundary
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    /**
     * @static getDerivedStateFromError
     * @description Lifecycle method to update state so the next render will show the fallback UI.
     * @param {Error} error - The error that was thrown.
     * @returns {ErrorBoundaryState} New state to update the component.
     */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error: error, errorInfo: null };
    }

    /**
     * @method componentDidCatch
     * @description Lifecycle method to catch JavaScript errors in the child component tree.
     * This is also a good place to log error information to an error reporting service.
     * @param {Error} error - The error that was caught.
     * @param {React.ErrorInfo} errorInfo - Information about which component threw the error.
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // Render any custom fallback UI passed via props or a default one
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center h-full text-red-400 p-8 bg-slate-900 rounded-lg">
                    <p className="text-2xl font-bold mb-4">Oops! Something went wrong.</p>
                    <p className="text-lg mb-2">We're sorry for the inconvenience.</p>
                    {this.state.error && <details className="text-sm mt-4 p-2 bg-slate-800 rounded-md max-w-lg overflow-auto">
                        <summary className="cursor-pointer text-red-300">Error Details</summary>
                        <pre className="whitespace-pre-wrap text-red-200 mt-2">{this.state.error.toString()}</pre>
                        {this.state.errorInfo && <pre className="whitespace-pre-wrap text-red-200 mt-2">{this.state.errorInfo.componentStack}</pre>}
                    </details>}
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 ease-in-out"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// --- Component: StickyNote ---

/**
 * @component StickyNote
 * @description Renders an individual sticky note with drag, edit, delete, and color change functionality.
 * This component is memoized using `React.memo` to optimize performance by preventing
 * unnecessary re-renders if its props haven't changed.
 * @param {StickyNoteProps} props - Props for the StickyNote component.
 */
const StickyNote: FC<StickyNoteProps> = React.memo(({
    note,
    isDragging,
    onUpdateText,
    onDelete,
    onMouseDown,
    onUpdateColor,
    onSetZIndex,
}) => {
    const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Effect to focus and select text in a new note's textarea
    useEffect(() => {
        if (note.text === 'New note...' && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select(); // Select "New note..." for easy overwrite
        }
    }, [note.text]);

    /**
     * @function handleColorChange
     * @description Handles changing the note's color and closes the color picker.
     * @param {string} colorClass - The Tailwind CSS class for the new color.
     */
    const handleColorChange = useCallback((colorClass: string) => {
        onUpdateColor(note.id, colorClass);
        setShowColorPicker(false);
    }, [note.id, onUpdateColor]);

    /**
     * @function handleDeleteClick
     * @description Opens the confirmation dialog for note deletion.
     */
    const handleDeleteClick = useCallback(() => {
        setShowDeleteConfirm(true);
    }, []);

    /**
     * @function confirmDelete
     * @description Confirms and executes the note deletion, then closes the dialog.
     */
    const confirmDelete = useCallback(() => {
        onDelete(note.id);
        setShowDeleteConfirm(false);
    }, [note.id, onDelete]);

    /**
     * @function cancelDelete
     * @description Cancels the note deletion and closes the dialog.
     */
    const cancelDelete = useCallback(() => {
        setShowDeleteConfirm(false);
    }, []);

    /**
     * @function handleInteractionStart
     * @description Unified handler for mouse down or focus events to bring the note to the front
     * and potentially initiate dragging.
     * @param {React.MouseEvent<HTMLDivElement> | React.FocusEvent<HTMLTextAreaElement>} e - The event object.
     */
    const handleInteractionStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.FocusEvent<HTMLTextAreaElement>) => {
        onSetZIndex(note.id); // Bring note to front on any interaction
        // If it's a mouse event on the note itself (not textarea/button), initiate drag
        if ('button' in e && (e.target as HTMLElement).tagName !== 'TEXTAREA' && (e.target as HTMLElement).tagName !== 'BUTTON') {
             onMouseDown(e as React.MouseEvent<HTMLDivElement>, note.id);
        }
    }, [note.id, onSetZIndex, onMouseDown]);

    return (
        <div
            className={`absolute w-48 h-48 p-2 flex flex-col shadow-lg transition-transform duration-100 ease-out rounded-lg group
                        ${note.color} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} focus-within:ring-2 focus-within:ring-cyan-400`}
            style={{
                top: note.y,
                left: note.x,
                zIndex: note.zIndex,
                transform: isDragging ? 'scale(1.05) rotate(3deg)' : 'scale(1)',
                minWidth: '192px', // Tailwind w-48
                minHeight: '192px' // Tailwind h-48
            }}
            onMouseDown={handleInteractionStart}
            role="note"
            aria-roledescription="draggable sticky note"
            aria-label={`Note content: ${note.text.substring(0, 50)}${note.text.length > 50 ? '...' : ''}`}
            tabIndex={0} // Make the note itself focusable for a11y, primarily for keyboard deletion
            onKeyDown={(e) => {
                // Alt+Delete to delete note for accessibility
                if (e.key === 'Delete' && e.altKey) {
                    e.preventDefault(); // Prevent browser default delete behavior
                    handleDeleteClick();
                }
            }}
        >
            {/* Delete Button */}
            <button
                onClick={handleDeleteClick}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white font-bold text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity duration-200 z-10"
                title="Delete Note (Alt+Delete)"
                aria-label={`Delete note: ${note.text.substring(0, 20)}...`}
            >
                <XIcon className="w-3 h-3" />
            </button>

            {/* Color Picker Button */}
            <button
                onClick={() => { setShowColorPicker(!showColorPicker); onSetZIndex(note.id); }} // Bring to front when opening color picker
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity duration-200 z-10"
                title="Change Note Color"
                aria-haspopup="true"
                aria-expanded={showColorPicker}
                aria-controls={`color-picker-${note.id}`}
            >
                <PaletteIcon className="w-3 h-3" />
            </button>

            {/* Color Picker */}
            {showColorPicker && (
                <div
                    id={`color-picker-${note.id}`}
                    className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-wrap gap-1 p-2 bg-slate-700 rounded-md shadow-lg z-20"
                    onMouseLeave={() => setShowColorPicker(false)} // Close if mouse leaves picker area
                    role="listbox"
                    aria-label="Note colors"
                >
                    {colors.map(colorClass => (
                        <button
                            key={colorClass}
                            className={`w-5 h-5 rounded-full border-2 border-transparent hover:border-white focus:border-white focus:outline-none ${colorClass}`}
                            onClick={() => handleColorChange(colorClass)}
                            title={`Set color to ${colorClass.replace('bg-', '')}`}
                            aria-label={`Set note color to ${colorClass.replace('bg-', '')}`}
                            role="option"
                            aria-selected={note.color === colorClass}
                            tabIndex={0}
                        />
                    ))}
                </div>
            )}

            {/* Note Textarea */}
            <textarea
                ref={textareaRef}
                value={note.text}
                onChange={(e) => onUpdateText(note.id, e.target.value)}
                onFocus={() => onSetZIndex(note.id)} // Bring to front when textarea is focused
                className="w-full h-full bg-transparent text-black resize-none focus:outline-none font-medium p-1 overflow-auto custom-scrollbar"
                aria-label="Note content"
                placeholder="Write your note here..."
            />

            {/* Confirmation Dialog for Deletion */}
            <ConfirmationDialog
                isOpen={showDeleteConfirm}
                message="Are you sure you want to delete this note? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                confirmText="Delete"
                cancelText="Keep"
            />
        </div>
    );
});

// --- Component: DevNotesStickyPanel ---

/**
 * @component DevNotesStickyPanel
 * @description The main component for the sticky notes application.
 * It manages the overall state of notes, handles drag-and-drop logic across the board,
 * and orchestrates the rendering of individual StickyNote components.
 * @exports DevNotesStickyPanel
 */
export const DevNotesStickyPanel: React.FC = () => {
    // State to store all notes, persisted using the custom `useLocalStorage` hook.
    const [notes, setNotes] = useLocalStorage<Note[]>('devcore_notes', []);
    // State to manage the active dragging operation.
    const [dragging, setDragging] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null);
    // State for the search/filter input field.
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Ref for the notes board container to accurately calculate relative positions for dragging.
    const boardRef = useRef<HTMLDivElement>(null);

    // State to keep track of the highest z-index value to ensure active notes are always on top.
    const [maxZIndex, setMaxZIndex] = useState<number>(0);

    // Effect to initialize or update the maxZIndex based on current notes.
    useEffect(() => {
        if (notes.length > 0) {
            const currentMax = Math.max(...notes.map(n => n.zIndex));
            setMaxZIndex(currentMax > 0 ? currentMax : 1000); // Initialize with a high base if no notes have zIndex
        } else {
            setMaxZIndex(1000); // Default starting zIndex when board is empty
        }
    }, [notes]); // Recalculate maxZIndex whenever the notes array changes.

    /**
     * @function addNote
     * @description Adds a new sticky note to the panel.
     * The new note appears with default text, a rotating color, and is slightly offset
     * to prevent new notes from perfectly stacking on top of each other.
     * It's also brought to the front immediately.
     */
    const addNote = useCallback(() => {
        const offset = (notes.length % 10) * 20; // Slight offset for new notes
        const newNote: Note = {
            id: generateId(),
            text: 'New note...',
            x: 50 + offset,
            y: 50 + offset,
            color: colors[notes.length % colors.length],
            zIndex: maxZIndex + 1, // Bring new note to the front
        };
        setNotes((prevNotes) => [...prevNotes, newNote]);
        setMaxZIndex(prev => prev + 1); // Update maxZIndex
    }, [notes.length, setNotes, maxZIndex]); // Dependent on notes.length for color/position, maxZIndex for zIndex

    /**
     * @function updateText
     * @description Updates the text content of a specific note identified by its ID.
     * Memoized with `useCallback` to prevent unnecessary re-creations.
     * @param {number} id - The ID of the note to update.
     * @param {string} text - The new text content for the note.
     */
    const updateText = useCallback((id: number, text: string) => {
        setNotes((prevNotes) => prevNotes.map((n) => (n.id === id ? { ...n, text } : n)));
    }, [setNotes]);

    /**
     * @function updateColor
     * @description Updates the color of a specific note identified by its ID.
     * Memoized with `useCallback`.
     * @param {number} id - The ID of the note to update.
     * @param {string} color - The new Tailwind CSS color class for the note.
     */
    const updateColor = useCallback((id: number, color: string) => {
        setNotes((prevNotes) => prevNotes.map((n) => (n.id === id ? { ...n, color } : n)));
    }, [setNotes]);

    /**
     * @function deleteNote
     * @description Deletes a specific note from the panel.
     * Memoized with `useCallback`.
     * @param {number} id - The ID of the note to delete.
     */
    const deleteNote = useCallback((id: number) => {
        setNotes((prevNotes) => prevNotes.filter((n) => n.id !== id));
    }, [setNotes]);

    /**
     * @function setNoteZIndex
     * @description Brings a specific note to the front by updating its z-index to `maxZIndex + 1`.
     * This ensures the currently interacted note is always visible over others.
     * Memoized with `useCallback`.
     * @param {number} id - The ID of the note to bring to the front.
     */
    const setNoteZIndex = useCallback((id: number) => {
        setMaxZIndex((prev) => prev + 1); // Increment maxZIndex for the new front note
        setNotes((prevNotes) =>
            prevNotes.map((n) => (n.id === id ? { ...n, zIndex: maxZIndex + 1 } : n))
        );
    }, [setNotes, maxZIndex]);

    /**
     * @function onMouseDown
     * @description Handles the mouse down event on a note to initiate dragging.
     * Calculates the offset from the mouse pointer to the note's top-left corner
     * to ensure smooth dragging without "jumping".
     * Memoized with `useCallback`.
     * @param {React.MouseEvent<HTMLDivElement>} e - The mouse event.
     * @param {number} id - The ID of the note being dragged.
     */
    const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, id: number) => {
        // Prevent drag if click originated from interactive elements within the note
        if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'BUTTON') {
            return;
        }
        const noteElement = e.currentTarget;
        const rect = noteElement.getBoundingClientRect();
        setDragging({ id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
        setNoteZIndex(id); // Bring to front when dragging starts
    }, [setNoteZIndex]);

    /**
     * @function onMouseMove
     * @description Handles the mouse move event on the board to update the dragged note's position.
     * Clamps the note's position to prevent it from being dragged outside the board boundaries.
     * Memoized with `useCallback`.
     * @param {React.MouseEvent<HTMLDivElement>} e - The mouse event.
     */
    const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!dragging || !boardRef.current) return;

        const boardRect = boardRef.current.getBoundingClientRect();
        const noteWidth = 192; // Corresponds to Tailwind's w-48
        const noteHeight = 192; // Corresponds to Tailwind's h-48

        // Calculate new position relative to the board
        const newX = e.clientX - dragging.offsetX - boardRect.left;
        const newY = e.clientY - dragging.offsetY - boardRect.top;

        // Clamp positions to keep the note within the board's bounds
        const clampedX = Math.max(0, Math.min(newX, boardRect.width - noteWidth));
        const clampedY = Math.max(0, Math.min(newY, boardRect.height - noteHeight));

        setNotes((prevNotes) =>
            prevNotes.map((n) =>
                n.id === dragging.id
                    ? { ...n, x: clampedX, y: clampedY }
                    : n
            )
        );
    }, [dragging, setNotes]);

    /**
     * @function onMouseUp
     * @description Resets the dragging state when the mouse button is released, ending the drag operation.
     * Memoized with `useCallback`.
     */
    const onMouseUp = useCallback(() => setDragging(null), []);

    // Effect to set up a global keyboard shortcut for adding a new note (e.g., Ctrl+Shift+A).
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault(); // Prevent default browser action (e.g., opening print dialog)
                addNote();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown); // Cleanup event listener
    }, [addNote]); // Dependency on addNote ensures the latest function is used.

    // Filtered notes based on the current search term, for displaying matching notes.
    const filteredNotes = notes.filter(note =>
        note.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ErrorBoundary fallback={<div className="text-red-500 p-4">Failed to load the Dev Notes Panel due to an unexpected error.</div>}>
            <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 font-sans">
                <header className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex-grow">
                        <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                            <FileCodeIcon className="w-8 h-8 text-cyan-400 mr-3" aria-hidden="true" />
                            <span id="panel-title">Dev Notes Sticky Panel</span>
                        </h1>
                        <p className="text-slate-400 mt-1" id="panel-description">
                            A place for your thoughts, todos, and random ideas.
                            <span className="hidden sm:inline"> (Keyboard shortcuts: <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">Ctrl</kbd>+<kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">Shift</kbd>+<kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">A</kbd> to add note, <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">Alt</kbd>+<kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">Del</kbd> to delete note)</span>
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                         <div className="relative w-full sm:w-48">
                            <input
                                type="text"
                                placeholder="Search notes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-800 text-slate-100 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full"
                                aria-label="Search notes"
                                id="note-search-input"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                        </div>
                        <button
                            onClick={addNote}
                            className="w-full sm:w-auto px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-75 transition duration-150 ease-in-out flex items-center justify-center gap-2"
                            aria-label="Add new note"
                        >
                            <PlusIcon className="w-5 h-5" aria-hidden="true" />
                            <span>Add Note</span>
                        </button>
                    </div>
                </header>

                <div
                    ref={boardRef}
                    className="relative flex-grow bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-lg overflow-hidden touch-none"
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp} // Stop dragging if mouse leaves the board area
                    role="region"
                    aria-labelledby="panel-title"
                    aria-describedby="panel-description"
                >
                    {filteredNotes.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xl font-medium select-none pointer-events-none p-4 text-center">
                            {searchTerm ? (
                                <>
                                    <p className="mb-2">No notes found matching "{searchTerm}".</p>
                                    <p className="text-base text-slate-600">Try a different search term or clear the filter.</p>
                                </>
                            ) : (
                                'Click "Add Note" to start writing!'
                            )}
                        </div>
                    )}
                    {filteredNotes.map((note: Note) => (
                        <StickyNote
                            key={note.id}
                            note={note}
                            isDragging={dragging?.id === note.id}
                            onUpdateText={updateText}
                            onDelete={deleteNote}
                            onMouseDown={onMouseDown}
                            onUpdateColor={updateColor}
                            onSetZIndex={setNoteZIndex}
                        />
                    ))}
                </div>
            </div>
        </ErrorBoundary>
    );
};