import React from 'react';
import { BeakerIcon } from '../icons/FeatureIcons';

const mockPackages = [
    { name: 'react', size: 145, color: 'bg-cyan-600' },
    { name: 'react-dom', size: 120, color: 'bg-sky-600' },
    { name: 'xterm', size: 90, color: 'bg-blue-600' },
    { name: 'tailwind', size: 75, color: 'bg-indigo-600' },
    { name: 'other', size: 50, color: 'bg-purple-600' },
    { name: 'local', size: 25, color: 'bg-slate-600' },
].sort((a, b) => b.size - a.size);

const Treemap: React.FC<{ data: typeof mockPackages }> = ({ data }) => {
    const totalSize = data.reduce((sum, item) => sum + item.size, 0);

    return (
        <div className="w-full h-full flex flex-wrap">
            {data.map(item => (
                <div
                    key={item.name}
                    className={`flex items-center justify-center text-white font-bold transition-all duration-300 ${item.color}`}
                    style={{
                        width: `${(item.size / totalSize) * 100}%`,
                        height: '100%',
                    }}
                >
                   <div className="text-center p-2">
                        <div>{item.name}</div>
                        <div className="text-xs opacity-80">{item.size} KB</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PackageSizeInspector: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <BeakerIcon />
                    <span className="ml-3">Package Size Inspector (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A treemap visualization of a simulated project's bundle size.</p>
            </header>
            <div className="flex-grow bg-slate-900 p-4 rounded-lg">
                <Treemap data={mockPackages} />
            </div>
        </div>
    );
};