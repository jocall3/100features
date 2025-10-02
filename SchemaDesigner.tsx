// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState } from 'react';
import { MapIcon } from '../icons/FeatureIcons.tsx';

interface Column {
    id: number;
    name: string;
    type: string;
}

interface Table {
    id: number;
    name: string;
    columns: Column[];
}

export const SchemaDesigner: React.FC = () => {
    const [tables, setTables] = useState<Table[]>([
        { id: 1, name: 'users', columns: [{ id: 1, name: 'id', type: 'INT' }, {id: 2, name: 'username', type: 'VARCHAR'}] },
        { id: 2, name: 'posts', columns: [{ id: 1, name: 'id', type: 'INT' }, {id: 2, name: 'user_id', type: 'INT'}, {id: 3, name: 'content', type: 'TEXT'}] },
    ]);
    const [newTableName, setNewTableName] = useState('');
    
    const addTable = () => {
        if(!newTableName) return;
        setTables([...tables, { id: Date.now(), name: newTableName, columns: [{ id: Date.now(), name: 'id', type: 'INT' }] }]);
        setNewTableName('');
    };

    const addColumn = (tableId: number) => {
        setTables(tables.map(t => t.id === tableId ? {...t, columns: [...t.columns, {id: Date.now(), name: 'new_column', type: 'VARCHAR'}]} : t));
    };
    
    const updateColumn = (tableId: number, colId: number, field: 'name' | 'type', value: string) => {
        setTables(tables.map(t => t.id === tableId ? {...t, columns: t.columns.map(c => c.id === colId ? {...c, [field]: value} : c)} : t));
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <MapIcon />
                    <span className="ml-3">Schema Designer</span>
                </h1>
                <p className="text-slate-400 mt-1">Visually design your database schema.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                     <div className="flex gap-2">
                        <input type="text" value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="New table name..." className="flex-grow px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-sm"/>
                        <button onClick={addTable} className="px-4 py-1.5 bg-cyan-500 text-slate-900 font-bold rounded-md">Add Table</button>
                    </div>
                    <div className="space-y-4">
                    {tables.map(table => (
                        <div key={table.id} className="bg-slate-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-cyan-400 text-lg mb-2">{table.name}</h3>
                            <div className="space-y-2">
                                {table.columns.map(col => (
                                    <div key={col.id} className="flex items-center gap-2 font-mono text-sm">
                                        <input value={col.name} onChange={e => updateColumn(table.id, col.id, 'name', e.target.value)} className="w-1/2 px-2 py-1 rounded bg-slate-800 border border-slate-700"/>
                                        <input value={col.type} onChange={e => updateColumn(table.id, col.id, 'type', e.target.value)} className="w-1/2 px-2 py-1 rounded bg-slate-800 border border-slate-700"/>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => addColumn(table.id)} className="text-xs mt-3 px-3 py-1 bg-slate-700 rounded-md">Add Column</button>
                        </div>
                    ))}
                    </div>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-400 mb-2">JSON Output</label>
                    <div className="relative flex-grow">
                        <pre className="w-full h-full bg-slate-900 p-4 rounded-md text-cyan-300 text-sm overflow-auto">
                            {JSON.stringify(tables, null, 2)}
                        </pre>
                        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(tables, null, 2))} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs">Copy</button>
                    </div>
                </div>
            </div>
        </div>
    );
};