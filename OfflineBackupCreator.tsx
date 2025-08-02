
import React, { useState } from 'react';
import { CloudIcon } from '../icons/FeatureIcons';

export const OfflineBackupCreator: React.FC = () => {
    const [backupData, setBackupData] = useState<string | null>(null);

    const createBackup = () => {
        const allData: { [key: string]: any } = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('devcore_')) {
                try {
                    allData[key] = JSON.parse(localStorage.getItem(key)!);
                } catch {
                    allData[key] = localStorage.getItem(key);
                }
            }
        }
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        setBackupData(URL.createObjectURL(dataBlob));
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CloudIcon />
                    <span className="ml-3">Offline Backup Creator</span>
                </h1>
                <p className="text-slate-400 mt-1">Create a downloadable backup of all your data from this app.</p>
            </header>
            <div className="flex flex-col items-center gap-4">
                <button
                    onClick={createBackup}
                    className="px-8 py-4 bg-cyan-500 text-slate-900 font-bold rounded-lg text-lg"
                >
                    Create Backup File
                </button>
                {backupData && (
                     <a
                        href={backupData}
                        download="devcore-backup.json"
                        className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg"
                    >
                        Download Backup
                    </a>
                )}
            </div>
        </div>
    );
};
