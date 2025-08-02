
import React, { useState, useMemo } from 'react';
import { CommandLineIcon } from '../icons/FeatureIcons.tsx';

export const CustomCliGenerator: React.FC = () => {
    const [commandName, setCommandName] = useState('my-cli');
    const [description, setDescription] = useState('A cool new command-line tool.');
    const [hasOption, setHasOption] = useState(true);
    const [optionName, setOptionName] = useState('config');

    const generatedCode = useMemo(() => {
        return `#!/usr/bin/env node
const { program } = require('commander');

program
  .version('0.0.1')
  .description('${description}');

program
  .command('run <task>')
  .description('Run a specific task')
  ${hasOption ? `.option('-c, --${optionName} <path>', 'Path to config file')` : ''}
  .action((task, options) => {
    console.log(\`Running task: \${task}\`);
    ${hasOption ? `if (options.${optionName}) console.log('Using config: ' + options.${optionName});` : ''}
  });

program.parse(process.argv);
`;
    }, [description, hasOption, optionName]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CommandLineIcon />
                    <span className="ml-3">Custom CLI Generator</span>
                </h1>
                <p className="text-slate-400 mt-1">Generate boilerplate for a Node.js CLI tool with Commander.js.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                 <div className="flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold">Configuration</h3>
                    <div>
                        <label htmlFor="commandName" className="block text-sm font-medium text-slate-400">Command Name</label>
                        <input type="text" id="commandName" value={commandName} onChange={e => setCommandName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-400">Description</label>
                        <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="hasOption" checked={hasOption} onChange={e => setHasOption(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                         <label htmlFor="hasOption" className="ml-2 block text-sm text-slate-300">Include an option flag?</label>
                    </div>
                    {hasOption && (
                         <div>
                            <label htmlFor="optionName" className="block text-sm font-medium text-slate-400">Option Name (e.g., --&lt;name&gt;)</label>
                            <input type="text" id="optionName" value={optionName} onChange={e => setOptionName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"/>
                        </div>
                    )}
                </div>
                <div className="flex flex-col">
                     <label className="text-sm font-medium text-slate-400 mb-2">Generated Code ({commandName}.js)</label>
                     <div className="relative flex-grow">
                        <pre className="w-full h-full bg-slate-900 p-4 rounded-md text-cyan-300 text-sm overflow-auto font-mono">{generatedCode}</pre>
                        <button onClick={handleCopy} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs">Copy</button>
                    </div>
                </div>
            </div>
        </div>
    );
};