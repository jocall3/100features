import React, { useState } from 'react';
import { FileCodeIcon } from '../icons/FeatureIcons.tsx';

interface Note {
    id: number;
    text: string;
    x: number;
    y: number;
    color: string;
}

const useLocalStorage = (key: string, initialValue: any) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) { return initialValue; }
    });
    const setValue = (value: any) => {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
    };
    return [storedValue, setValue];
};

const colors = ['bg-yellow-300', 'bg-green-300', 'bg-blue-300', 'bg-pink-300', 'bg-purple-300'];

export const DevNotesStickyPanel: React.FC = () => {
    const [notes, setNotes] = useLocalStorage('devcore_notes', []);
    const [dragging, setDragging] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null);

    const addNote = () => {
        const newNote: Note = {
            id: Date.now(),
            text: 'New note...',
            x: 50 + (notes.length % 10) * 20,
            y: 50 + (notes.length % 10) * 20,
            color: colors[notes.length % colors.length],
        };
        setNotes([...notes, newNote]);
    };

    const updateText = (id: number, text: string) => {
        setNotes(notes.map((n: Note) => n.id === id ? { ...n, text } : n));
    };
    
    const deleteNote = (id: number) => {
        setNotes(notes.filter((n: Note) => n.id !== id));
    };

    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: number) => {
        if((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'BUTTON') return;
        const noteElement = e.currentTarget;
        const rect = noteElement.getBoundingClientRect();
        setDragging({ id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
    };

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!dragging) return;
        const boardRect = e.currentTarget.getBoundingClientRect();
        setNotes(
            notes.map((n: Note) =>
                n.id === dragging.id
                    ? { ...n, x: e.clientX - dragging.offsetX - boardRect.left, y: e.clientY - dragging.offsetY - boardRect.top }
                    : n
            )
        );
    };

    const onMouseUp = () => setDragging(null);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <FileCodeIcon />
                        <span className="ml-3">Dev Notes Sticky Panel</span>
                    </h1>
                    <p className="text-slate-400 mt-1">A place for your thoughts, todos, and random ideas.</p>
                </div>
                <button onClick={addNote} className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-md">Add Note</button>
            </header>
            <div
                className="relative flex-grow bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-lg overflow-hidden"
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >
                {notes.map((note: Note) => (
                    <div
                        key={note.id}
                        className={`absolute w-48 h-48 p-2 flex flex-col shadow-lg cursor-grab active:cursor-grabbing ${note.color}`}
                        style={{ top: note.y, left: note.x, transform: dragging?.id === note.id ? 'scale(1.05) rotate(3deg)' : 'scale(1)' }}
                        onMouseDown={e => onMouseDown(e, note.id)}
                    >
                         <button onClick={() => deleteNote(note.id)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white font-bold text-xs flex items-center justify-center opacity-0 hover:opacity-100">&times;</button>
                        <textarea
                            value={note.text}
                            onChange={(e) => updateText(note.id, e.target.value)}
                            className="w-full h-full bg-transparent text-black resize-none focus:outline-none font-medium p-1"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};