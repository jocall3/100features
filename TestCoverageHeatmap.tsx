import React from 'react';
import { ChartBarIcon } from '../icons/FeatureIcons';

const mockCode = `
function calculateTotal(items, tax) {
  if (!items || items.length === 0) {
    return 0;
  }

  const subtotal = items.reduce((sum, item) => {
    if (item.price < 0) {
      console.warn('Negative price detected');
      return sum;
    }
    return sum + item.price;
  }, 0);

  const total = subtotal * (1 + tax);
  return total;
}
`;

const coverageData = [
    { line: 2, status: 'covered' }, // function declaration
    { line: 3, status: 'covered' }, // if condition
    { line: 4, status: 'covered' }, // return 0
    { line: 7, status: 'covered' }, // reduce
    { line: 8, status: 'partial' }, // inner if
    { line: 9, status: 'uncovered' }, // console.warn
    { line: 10, status: 'partial' }, // return sum
    { line: 12, status: 'covered' }, // return sum + item.price
    { line: 15, status: 'covered' }, // const total
    { line: 16, status: 'covered' }, // return total
];

export const TestCoverageHeatmap: React.FC = () => {
    const getLineClass = (lineNumber: number) => {
        const lineData = coverageData.find(d => d.line === lineNumber);
        if (!lineData) return '';
        switch (lineData.status) {
            case 'covered': return 'bg-green-500/20';
            case 'uncovered': return 'bg-red-500/20';
            case 'partial': return 'bg-yellow-500/20';
            default: return '';
        }
    };
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <ChartBarIcon />
                    <span className="ml-3">Test Coverage Heatmap (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation showing line-by-line test coverage.</p>
            </header>
            <div className="flex-grow flex font-mono text-sm bg-slate-900 rounded-lg overflow-hidden">
                <div className="p-4 text-slate-600 text-right select-none">
                    {mockCode.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
                </div>
                <pre className="p-4 w-full overflow-x-auto">
                    {mockCode.split('\n').map((line, i) => (
                         <div key={i} className={`px-2 rounded-sm ${getLineClass(i + 1)}`}>
                            {line || ' '}
                        </div>
                    ))}
                </pre>
            </div>
             <div className="flex justify-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500/20 rounded-sm"></div> Covered</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-500/20 rounded-sm"></div> Partial</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500/20 rounded-sm"></div> Uncovered</div>
            </div>
        </div>
    );
};