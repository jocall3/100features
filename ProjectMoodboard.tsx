// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import { PhotoIcon } from '../icons/FeatureIcons';

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

const colors = ['bg-yellow-300', 'bg-green-300', 'bg-blue-300', 'bg-pink-300'];

export const ProjectMoodboard: React.FC = () => {
    const [notes, setNotes] = useLocalStorage('devcore_moodboard', []);
    const [dragging, setDragging] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null);

    const addNote = () => {
        const newNote: Note = {
            id: Date.now(),
            text: 'New idea...',
            x: 50,
            y: 50,
            color: colors[Math.floor(Math.random() * colors.length)],
        };
        setNotes([...notes, newNote]);
    };

    const updateText = (id: number, text: string) => {
        setNotes(notes.map((n: Note) => n.id === id ? { ...n, text } : n));
    };

    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: number) => {
        const noteElement = e.currentTarget;
        const rect = noteElement.getBoundingClientRect();
        setDragging({
            id,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
        });
    };

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!dragging) return;
        setNotes(
            notes.map((n: Note) =>
                n.id === dragging.id
                    ? { ...n, x: e.clientX - dragging.offsetX - e.currentTarget.getBoundingClientRect().left, y: e.clientY - dragging.offsetY - e.currentTarget.getBoundingClientRect().top }
                    : n
            )
        );
    };

    const onMouseUp = () => {
        setDragging(null);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                        <PhotoIcon />
                        <span className="ml-3">Project Moodboard</span>
                    </h1>
                    <p className="text-slate-400 mt-1">Organize your ideas with draggable sticky notes.</p>
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
                        style={{ top: note.y, left: note.x, transform: dragging?.id === note.id ? 'scale(1.05)' : 'scale(1)' }}
                        onMouseDown={e => onMouseDown(e, note.id)}
                    >
                        <textarea
                            value={note.text}
                            onChange={(e) => updateText(note.id, e.target.value)}
                             onMouseDown={(e) => e.stopPropagation()}
                            className="w-full h-full bg-transparent text-black resize-none focus:outline-none font-medium"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};