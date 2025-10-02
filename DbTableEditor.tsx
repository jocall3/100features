// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import { ServerIcon } from '../icons/FeatureIcons.tsx';

const initialData = [
    { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
    { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user' },
];

export const DbTableEditor: React.FC = () => {
    const [data, setData] = useState(initialData);
    const headers = Object.keys(data[0] || {});

    const handleCellChange = (rowIndex: number, key: string, value: string) => {
        const newData = [...data];
        // @ts-ignore
        newData[rowIndex][key] = value;
        setData(newData);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ServerIcon />
                    <span className="ml-3">Database Table Editor (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A spreadsheet-like interface for editing database records.</p>
            </header>
            <div className="flex-grow overflow-auto bg-slate-900 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-slate-800">
                        <tr>
                            {headers.map(header => (
                                <th key={header} className="p-3 font-bold">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={row.id} className="border-b border-slate-800">
                                {headers.map(key => (
                                    <td key={key} className="p-0">
                                        <input
                                            type="text"
                                            value={String(row[key as keyof typeof row])}
                                            onChange={(e) => handleCellChange(rowIndex, key, e.target.value)}
                                            className="w-full h-full p-3 bg-transparent focus:bg-slate-800/50 focus:outline-none"
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};