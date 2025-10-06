```tsx
// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

// This file implements a sophisticated CLI Generator tool.
// It allows users to define a command-line interface with various options,
// arguments, and subcommands, generating boilerplate code using Commander.js.
// The component is designed for enterprise-grade applications, focusing on
// TypeScript for type safety, a modular state structure, and a user-friendly
// interface for defining complex CLI configurations.
// It includes responsive styling with Tailwind CSS and basic accessibility features.

import React, { useState, useMemo, useCallback } from 'react';
import { CommandLineIcon } from '../icons/FeatureIcons.tsx';

/**
 * @typedef {'string' | 'boolean' | 'number'} IOptionType
 * Enum for CLI option types.
 */
export type IOptionType = 'string' | 'boolean' | 'number';

/**
 * @interface ICliOption
 * Defines the structure for a single CLI option.
 */
export interface ICliOption {
    id: string; // Unique identifier for React keys
    name: string; // Long form name, e.g., 'config'
    alias?: string; // Short form alias, e.g., 'c'
    description: string;
    type: IOptionType; // Type of the option value
    defaultValue?: string | boolean | number;
    required: boolean;
}

/**
 * @interface ICliArgument
 * Defines the structure for a single CLI argument.
 */
export interface ICliArgument {
    id: string; // Unique identifier for React keys
    name: string; // Argument name, e.g., '<task>'
    description: string;
    required: boolean;
    variadic: boolean; // True if it's a variadic argument (e.g., 'files...')
}

/**
 * @interface ICliCommand
 * Defines the structure for a subcommand within the CLI.
 */
export interface ICliCommand {
    id: string; // Unique identifier for React keys
    name: string;
    description: string;
    arguments: ICliArgument[];
    options: ICliOption[];
}

/**
 * @interface ICliConfig
 * Defines the overall configuration for the CLI generator.
 */
export interface ICliConfig {
    commandName: string;
    description: string;
    version: string;
    globalOptions: ICliOption[];
    subcommands: ICliCommand[];
}

/**
 * Helper function to generate a unique ID.
 * @returns {string} A unique ID string.
 */
const generateUniqueId = (): string => Math.random().toString(36).substr(2, 9);

/**
 * Formats an option string for Commander.js definition.
 * @param {ICliOption} option - The CLI option to format.
 * @returns {string} The formatted option string for program.option().
 */
const formatOptionString = (option: ICliOption): string => {
    const aliasPart = option.alias ? `-${option.alias}, ` : '';
    let valuePart = '';
    if (option.type === 'string') {
        valuePart = option.required ? ` <${option.name}>` : ` [${option.name}]`;
    } else if (option.type === 'number') {
        valuePart = option.required ? ` <${option.name}>` : ` [${option.name}]`;
    }
    // Boolean options are just flags and don't need a value part in the definition string.

    return `${aliasPart}--${option.name}${valuePart}, '${option.description}'`;
};

/**
 * Formats an argument string for Commander.js definition.
 * @param {ICliArgument} arg - The CLI argument to format.
 * @returns {string} The formatted argument string for command().
 */
const formatArgumentString = (arg: ICliArgument): string => {
    if (arg.variadic) {
        return arg.required ? `<${arg.name}...>` : `[${arg.name}...]`;
    }
    return arg.required ? `<${arg.name}>` : `[${arg.name}]`;
};

/**
 * @function CustomCliGenerator
 * @description
 * A React functional component that provides a user interface for generating
 * boilerplate Node.js CLI code using Commander.js. Users can configure the
 * command name, description, version, global options, and define multiple
 * subcommands with their own arguments and options.
 *
 * The component leverages React's `useState` for managing complex nested state
 * and `useMemo` for efficient code generation. It includes a copy-to-clipboard
 * feature with a temporary notification.
 *
 * @returns {JSX.Element} The rendered CLI generator UI.
 */
export const CustomCliGenerator: React.FC = () => {
    const [cliConfig, setCliConfig] = useState<ICliConfig>({
        commandName: 'my-cli',
        description: 'A cool new command-line tool built with Commander.js.',
        version: '0.0.1',
        globalOptions: [],
        subcommands: [
            {
                id: generateUniqueId(),
                name: 'run',
                description: 'Run a specific task',
                arguments: [{ id: generateUniqueId(), name: 'task', description: 'The task to execute', required: true, variadic: false }],
                options: [
                    {
                        id: generateUniqueId(),
                        name: 'config',
                        alias: 'c',
                        description: 'Path to config file',
                        type: 'string',
                        defaultValue: './config.json',
                        required: false,
                    },
                ],
            },
        ],
    });

    const [showNotification, setShowNotification] = useState(false);

    /**
     * Handles changes to basic string/text inputs for the main CLI configuration.
     * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - The change event.
     * @param {keyof ICliConfig} field - The field name to update.
     */
    const handleConfigChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof ICliConfig) => {
        setCliConfig(prev => ({ ...prev, [field]: e.target.value }));
    }, []);

    /**
     * Adds a new global option to the CLI configuration.
     */
    const addGlobalOption = useCallback(() => {
        setCliConfig(prev => ({
            ...prev,
            globalOptions: [
                ...prev.globalOptions,
                { id: generateUniqueId(), name: 'new-option', description: 'A new global option', type: 'string', required: false },
            ],
        }));
    }, []);

    /**
     * Updates an existing global option.
     * @param {string} id - The ID of the option to update.
     * @param {Partial<ICliOption>} updatedFields - The fields to update.
     */
    const updateGlobalOption = useCallback((id: string, updatedFields: Partial<ICliOption>) => {
        setCliConfig(prev => ({
            ...prev,
            globalOptions: prev.globalOptions.map(opt =>
                opt.id === id ? { ...opt, ...updatedFields } : opt
            ),
        }));
    }, []);

    /**
     * Removes a global option by its ID.
     * @param {string} id - The ID of the option to remove.
     */
    const removeGlobalOption = useCallback((id: string) => {
        setCliConfig(prev => ({
            ...prev,
            globalOptions: prev.globalOptions.filter(opt => opt.id !== id),
        }));
    }, []);

    /**
     * Adds a new subcommand to the CLI configuration.
     */
    const addSubcommand = useCallback(() => {
        setCliConfig(prev => ({
            ...prev,
            subcommands: [
                ...prev.subcommands,
                { id: generateUniqueId(), name: 'new-command', description: 'A new subcommand', arguments: [], options: [] },
            ],
        }));
    }, []);

    /**
     * Updates an existing subcommand.
     * @param {string} id - The ID of the subcommand to update.
     * @param {Partial<ICliCommand>} updatedFields - The fields to update.
     */
    const updateSubcommand = useCallback((id: string, updatedFields: Partial<ICliCommand>) => {
        setCliConfig(prev => ({
            ...prev,
            subcommands: prev.subcommands.map(cmd =>
                cmd.id === id ? { ...cmd, ...updatedFields } : cmd
            ),
        }));
    }, []);

    /**
     * Removes a subcommand by its ID.
     * @param {string} id - The ID of the subcommand to remove.
     */
    const removeSubcommand = useCallback((id: string) => {
        setCliConfig(prev => ({
            ...prev,
            subcommands: prev.subcommands.filter(cmd => cmd.id !== id),
        }));
    }, []);

    /**
     * Adds an argument to a specific subcommand.
     * @param {string} commandId - The ID of the subcommand.
     */
    const addSubcommandArgument = useCallback((commandId: string) => {
        setCliConfig(prev => ({
            ...prev,
            subcommands: prev.subcommands.map(cmd =>
                cmd.id === commandId
                    ? {
                          ...cmd,
                          arguments: [
                              ...cmd.arguments,
                              { id: generateUniqueId(), name: 'arg', description: 'New argument', required: true, variadic: false },
                          ],
                      }
                    : cmd
            ),
        }));
    }, []);

    /**
     * Updates an argument within a specific subcommand.
     * @param {string} commandId - The ID of the subcommand.
     * @param {string} argId - The ID of the argument to update.
     * @param {Partial<ICliArgument>} updatedFields - The fields to update.
     */
    const updateSubcommandArgument = useCallback((commandId: string, argId: string, updatedFields: Partial<ICliArgument>) => {
        setCliConfig(prev => ({
            ...prev,
            subcommands: prev.subcommands.map(cmd =>
                cmd.id === commandId
                    ? {
                          ...cmd,
                          arguments: cmd.arguments.map(arg =>
                              arg.id === argId ? { ...arg, ...updatedFields } : arg
                          ),
                      }
                    : cmd
            ),
        }));
    }, []);

    /**
     * Removes an argument from a specific subcommand.
     * @param {string} commandId - The ID of the subcommand.
     * @param {string} argId - The ID of the argument to remove.
     */
    const removeSubcommandArgument = useCallback((commandId: string, argId: string) => {
        setCliConfig(prev => ({
            ...prev,
            subcommands: prev.subcommands.map(cmd =>
                cmd.id === commandId
                    ? { ...cmd, arguments: cmd.arguments.filter(arg => arg.id !== argId) }
                    : cmd
            ),
        }));
    }, []);

    /**
     * Adds an option to a specific subcommand.
     * @param {string} commandId - The ID of the subcommand.
     */
    const addSubcommandOption = useCallback((commandId: string) => {
        setCliConfig(prev => ({
            ...prev,
            subcommands: prev.subcommands.map(cmd =>
                cmd.id === commandId
                    ? {
                          ...cmd,
                          options: [
                              ...cmd.options,
                              { id: generateUniqueId(), name: 'new-option', description: 'A new subcommand option', type: 'string', required: false },
                          ],
                      }
                    : cmd
            ),
        }));
    }, []);

    /**
     * Updates an option within a specific subcommand.
     * @param {string} commandId - The ID of the subcommand.
     * @param {string} optionId - The ID of the option to update.
     * @param {Partial<ICliOption>} updatedFields - The fields to update.
     */
    const updateSubcommandOption = useCallback((commandId: string, optionId: string, updatedFields: Partial<ICliOption>) => {
        setCliConfig(prev => ({
            ...prev,
            subcommands: prev.subcommands.map(cmd =>
                cmd.id === commandId
                    ? {
                          ...cmd,
                          options: cmd.options.map(opt =>
                              opt.id === optionId ? { ...opt, ...updatedFields } : opt
                          ),
                      }
                    : cmd
            ),
        }));
    }, []);

    /**
     * Removes an option from a specific subcommand.
     * @param {string} commandId - The ID of the subcommand.
     * @param {string} optionId - The ID of the option to remove.
     */
    const removeSubcommandOption = useCallback((commandId: string, optionId: string) => {
        setCliConfig(prev => ({
            ...prev,
            subcommands: prev.subcommands.map(cmd =>
                cmd.id === commandId
                    ? { ...cmd, options: cmd.options.filter(opt => opt.id !== optionId) }
                    : cmd
            ),
        }));
    }, []);

    /**
     * Generates the Commander.js code based on the current CLI configuration.
     * This is memoized to prevent unnecessary re-renders of the code block.
     */
    const generatedCode = useMemo(() => {
        const { commandName, description, version, globalOptions, subcommands } = cliConfig;

        let code = `#!/usr/bin/env node
const { program } = require('commander');

program
  .name('${commandName}')
  .version('${version}')
  .description('${description}');
`;

        // Add global options
        globalOptions.forEach(option => {
            code += `\nprogram.option('${formatOptionString(option)}');`;
        });

        // Add subcommands
        subcommands.forEach(cmd => {
            const argsListForCommand = cmd.arguments.map(formatArgumentString).join(' ');
            code += `\n\nprogram
  .command('${cmd.name}${argsListForCommand ? ` ${argsListForCommand}` : ''}')
  .description('${cmd.description}')`;

            // Add subcommand-specific options
            cmd.options.forEach(option => {
                code += `\n  .option('${formatOptionString(option)}')`;
            });

            // Prepare action function parameters
            const actionParams: string[] = cmd.arguments.map(arg => arg.name.replace(/<|\[|\]|\.|\.\.\./g, ''));
            if (cmd.options.length > 0) {
                actionParams.push('options');
            }

            code += `
  .action((${actionParams.filter(Boolean).join(', ')}) => {
    console.log(\`Executing command: ${cmd.name}\`);`;

            // Log arguments within action
            cmd.arguments.forEach(arg => {
                const argName = arg.name.replace(/<|\[|\]|\.|\.\.\./g, '');
                code += `\n    console.log('${argName}: ' + ${argName});`;
            });

            // Log options within action, considering default values
            cmd.options.forEach(option => {
                const defaultValueCheck = option.defaultValue !== undefined ? ` ?? ${JSON.stringify(option.defaultValue)}` : '';
                code += `\n    if (options.${option.name}) {
      console.log('${option.name}: ' + (options.${option.name}${defaultValueCheck}));
    }`;
                if (option.defaultValue !== undefined && !option.required && option.type !== 'boolean') {
                    code += `\n    // Note: Commander.js automatically applies default values when option not provided.
    // The above 'if' check only logs if the option was explicitly passed or its value is not null/undefined after parsing.`;
                }
            });
            code += `\n  });`;
        });

        code += `\n\nprogram.parse(process.argv);
`;
        return code;
    }, [cliConfig]);

    /**
     * Handles copying the generated code to the clipboard.
     * Shows a temporary notification upon successful copy.
     */
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(generatedCode).then(() => {
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 2000); // Hide after 2 seconds
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            // Optionally, show an error notification in the UI if needed
        });
    }, [generatedCode]);

    // Component for rendering a single CLI Option form section
    const CliOptionForm: React.FC<{
        option: ICliOption;
        onUpdate: (id: string, fields: Partial<ICliOption>) => void;
        onRemove: (id: string) => void;
        context: 'global' | 'subcommand'; // Added context for clarity if needed
    }> = React.memo(({ option, onUpdate, onRemove, context }) => {
        const idPrefix = `${context}-option-${option.id}`;

        return (
            <div className="bg-slate-700/30 p-4 rounded-md border border-slate-600 relative mb-4">
                <h4 className="text-lg font-semibold text-slate-200 mb-2">Option: <span className="text-cyan-400">{option.name}</span></h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor={`${idPrefix}-name`} className="block text-sm font-medium text-slate-400">Name (e.g., config)</label>
                        <input
                            type="text"
                            id={`${idPrefix}-name`}
                            value={option.name}
                            onChange={e => onUpdate(option.id, { name: e.target.value.replace(/\s/g, '-') })}
                            className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                            aria-describedby={`${idPrefix}-name-help`}
                        />
                        <p id={`${idPrefix}-name-help`} className="text-xs text-slate-500 mt-1">Long form, no spaces. Auto-hyphenated.</p>
                    </div>
                    <div>
                        <label htmlFor={`${idPrefix}-alias`} className="block text-sm font-medium text-slate-400">Alias (e.g., c)</label>
                        <input
                            type="text"
                            id={`${idPrefix}-alias`}
                            value={option.alias || ''}
                            onChange={e => onUpdate(option.id, { alias: e.target.value.substring(0, 1) })}
                            maxLength={1}
                            className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                            aria-describedby={`${idPrefix}-alias-help`}
                        />
                        <p id={`${idPrefix}-alias-help`} className="text-xs text-slate-500 mt-1">Short form, single character.</p>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor={`${idPrefix}-description`} className="block text-sm font-medium text-slate-400">Description</label>
                        <textarea
                            id={`${idPrefix}-description`}
                            value={option.description}
                            onChange={e => onUpdate(option.id, { description: e.target.value })}
                            rows={2}
                            className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500 resize-y"
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor={`${idPrefix}-type`} className="block text-sm font-medium text-slate-400">Type</label>
                        <select
                            id={`${idPrefix}-type`}
                            value={option.type}
                            onChange={e => onUpdate(option.id, { type: e.target.value as IOptionType })}
                            className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                        >
                            <option value="string">String</option>
                            <option value="boolean">Boolean (Flag)</option>
                            <option value="number">Number</option>
                        </select>
                    </div>
                    {option.type !== 'boolean' && (
                        <div>
                            <label htmlFor={`${idPrefix}-defaultValue`} className="block text-sm font-medium text-slate-400">Default Value</label>
                            <input
                                type={option.type === 'number' ? 'number' : 'text'}
                                id={`${idPrefix}-defaultValue`}
                                value={option.defaultValue !== undefined ? String(option.defaultValue) : ''}
                                onChange={e => {
                                    let value: string | number | boolean = e.target.value;
                                    if (option.type === 'number') {
                                        value = parseFloat(e.target.value);
                                        if (isNaN(value)) value = ''; // Allow empty string for clearing
                                    }
                                    onUpdate(option.id, { defaultValue: value });
                                }}
                                className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        </div>
                    )}
                    <div className="flex items-center md:col-span-2">
                        <input
                            type="checkbox"
                            id={`${idPrefix}-required`}
                            checked={option.required}
                            onChange={e => onUpdate(option.id, { required: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 bg-slate-800"
                        />
                        <label htmlFor={`${idPrefix}-required`} className="ml-2 block text-sm text-slate-300">Required?</label>
                    </div>
                </div>
                <button
                    onClick={() => onRemove(option.id)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 transition-colors duration-200"
                    aria-label={`Remove option ${option.name}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        );
    });

    // Component for rendering a single CLI Argument form section
    const CliArgumentForm: React.FC<{
        arg: ICliArgument;
        onUpdate: (id: string, fields: Partial<ICliArgument>) => void;
        onRemove: (id: string) => void;
        commandId: string; // To uniquely identify within a command
    }> = React.memo(({ arg, onUpdate, onRemove, commandId }) => {
        const idPrefix = `cmd-${commandId}-arg-${arg.id}`;
        return (
            <div className="bg-slate-600/30 p-3 rounded-md border border-slate-500 relative mb-2">
                <h5 className="text-md font-medium text-slate-200 mb-1">Argument: <span className="text-lime-400">{arg.name}</span></h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label htmlFor={`${idPrefix}-name`} className="block text-sm font-medium text-slate-400">Name (e.g., task)</label>
                        <input
                            type="text"
                            id={`${idPrefix}-name`}
                            value={arg.name}
                            onChange={e => onUpdate(arg.id, { name: e.target.value.replace(/\s/g, '-') })}
                            className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                            aria-describedby={`${idPrefix}-name-help`}
                        />
                        <p id={`${idPrefix}-name-help`} className="text-xs text-slate-500 mt-1">No spaces. Auto-hyphenated.</p>
                    </div>
                    <div>
                        <label htmlFor={`${idPrefix}-description`} className="block text-sm font-medium text-slate-400">Description</label>
                        <input
                            type="text"
                            id={`${idPrefix}-description`}
                            value={arg.description}
                            onChange={e => onUpdate(arg.id, { description: e.target.value })}
                            className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id={`${idPrefix}-required`}
                            checked={arg.required}
                            onChange={e => onUpdate(arg.id, { required: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 bg-slate-800"
                        />
                        <label htmlFor={`${idPrefix}-required`} className="ml-2 block text-sm text-slate-300">Required?</label>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id={`${idPrefix}-variadic`}
                            checked={arg.variadic}
                            onChange={e => onUpdate(arg.id, { variadic: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 bg-slate-800"
                        />
                        <label htmlFor={`${idPrefix}-variadic`} className="ml-2 block text-sm text-slate-300">Variadic (e.g., files...)?</label>
                    </div>
                </div>
                <button
                    onClick={() => onRemove(arg.id)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 transition-colors duration-200"
                    aria-label={`Remove argument ${arg.name}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        );
    });

    // Component for rendering a single CLI Command (subcommand) form section
    const CliCommandForm: React.FC<{
        command: ICliCommand;
        onUpdate: (id: string, fields: Partial<ICliCommand>) => void;
        onRemove: (id: string) => void;
        onAddArgument: (commandId: string) => void;
        onUpdateArgument: (commandId: string, argId: string, fields: Partial<ICliArgument>) => void;
        onRemoveArgument: (commandId: string, argId: string) => void;
        onAddOption: (commandId: string) => void;
        onUpdateOption: (commandId: string, optionId: string, fields: Partial<ICliOption>) => void;
        onRemoveOption: (commandId: string, optionId: string) => void;
    }> = React.memo(({
        command, onUpdate, onRemove,
        onAddArgument, onUpdateArgument, onRemoveArgument,
        onAddOption, onUpdateOption, onRemoveOption
    }) => {
        const idPrefix = `cmd-${command.id}`;
        return (
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 relative mb-6">
                <h3 className="text-xl font-bold text-slate-100 mb-4">Subcommand: <span className="text-purple-400">{command.name}</span></h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor={`${idPrefix}-name`} className="block text-sm font-medium text-slate-400">Command Name</label>
                        <input
                            type="text"
                            id={`${idPrefix}-name`}
                            value={command.name}
                            onChange={e => onUpdate(command.id, { name: e.target.value.replace(/\s/g, '-') })}
                            className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                            aria-describedby={`${idPrefix}-name-help`}
                        />
                        <p id={`${idPrefix}-name-help`} className="text-xs text-slate-500 mt-1">No spaces. Auto-hyphenated.</p>
                    </div>
                    <div>
                        <label htmlFor={`${idPrefix}-description`} className="block text-sm font-medium text-slate-400">Description</label>
                        <input
                            type="text"
                            id={`${idPrefix}-description`}
                            value={command.description}
                            onChange={e => onUpdate(command.id, { description: e.target.value })}
                            className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                </div>

                {/* Arguments Section */}
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-slate-200 mb-2 flex items-center justify-between">
                        Arguments
                        <button
                            onClick={() => onAddArgument(command.id)}
                            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-md transition-colors duration-200"
                        >
                            + Add Argument
                        </button>
                    </h4>
                    {command.arguments.length === 0 && <p className="text-slate-500 text-sm">No arguments defined for this subcommand.</p>}
                    {command.arguments.map(arg => (
                        <CliArgumentForm
                            key={arg.id}
                            arg={arg}
                            onUpdate={(argId, fields) => onUpdateArgument(command.id, argId, fields)}
                            onRemove={(argId) => onRemoveArgument(command.id, argId)}
                            commandId={command.id}
                        />
                    ))}
                </div>

                {/* Options Section */}
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-slate-200 mb-2 flex items-center justify-between">
                        Options
                        <button
                            onClick={() => onAddOption(command.id)}
                            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-md transition-colors duration-200"
                        >
                            + Add Option
                        </button>
                    </h4>
                    {command.options.length === 0 && <p className="text-slate-500 text-sm">No options defined for this subcommand.</p>}
                    {command.options.map(option => (
                        <CliOptionForm
                            key={option.id}
                            option={option}
                            onUpdate={(optId, fields) => onUpdateOption(command.id, optId, fields)}
                            onRemove={(optId) => onRemoveOption(command.id, optId)}
                            context="subcommand"
                        />
                    ))}
                </div>

                <button
                    onClick={() => onRemove(command.id)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 transition-colors duration-200"
                    aria-label={`Remove subcommand ${command.name}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        );
    });


    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100">
            {/* Notification Toast */}
            {showNotification && (
                <div
                    className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-all duration-300 ease-in-out transform translate-y-0 opacity-100"
                    role="status"
                    aria-live="polite"
                >
                    Copied to clipboard!
                </div>
            )}

            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CommandLineIcon className="h-8 w-8 text-cyan-500" />
                    <span className="ml-3">Advanced CLI Generator</span>
                </h1>
                <p className="text-slate-400 mt-1 text-lg">
                    Generate production-ready boilerplate for a Node.js CLI tool with <a href="https://github.com/tj/commander.js" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">Commander.js</a>.
                    Define commands, arguments, global and subcommand-specific options with ease.
                </p>
            </header>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* Configuration Panel */}
                <div className="flex flex-col gap-6 bg-slate-800/50 p-6 rounded-lg overflow-y-auto custom-scrollbar">
                    <h3 className="text-2xl font-bold border-b border-slate-700 pb-3 mb-3">CLI Configuration</h3>

                    {/* Main CLI Info */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="commandName" className="block text-sm font-medium text-slate-400">Main Command Name</label>
                            <input
                                type="text"
                                id="commandName"
                                value={cliConfig.commandName}
                                onChange={e => handleConfigChange(e, 'commandName')}
                                className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                                aria-describedby="commandName-help"
                            />
                            <p id="commandName-help" className="text-xs text-slate-500 mt-1">e.g., my-cli (no spaces, auto-hyphenated)</p>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-400">CLI Description</label>
                            <textarea
                                id="description"
                                value={cliConfig.description}
                                onChange={e => handleConfigChange(e, 'description')}
                                rows={3}
                                className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500 resize-y"
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="version" className="block text-sm font-medium text-slate-400">Version</label>
                            <input
                                type="text"
                                id="version"
                                value={cliConfig.version}
                                onChange={e => handleConfigChange(e, 'version')}
                                className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        </div>
                    </div>

                    {/* Global Options */}
                    <div className="mt-6 pt-4 border-t border-slate-700">
                        <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center justify-between">
                            Global Options
                            <button
                                onClick={addGlobalOption}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200"
                            >
                                + Add Global Option
                            </button>
                        </h3>
                        {cliConfig.globalOptions.length === 0 && <p className="text-slate-500 mb-4 text-sm">No global options defined.</p>}
                        {cliConfig.globalOptions.map(option => (
                            <CliOptionForm
                                key={option.id}
                                option={option}
                                onUpdate={updateGlobalOption}
                                onRemove={removeGlobalOption}
                                context="global"
                            />
                        ))}
                    </div>

                    {/* Subcommands */}
                    <div className="mt-6 pt-4 border-t border-slate-700">
                        <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center justify-between">
                            Subcommands
                            <button
                                onClick={addSubcommand}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors duration-200"
                            >
                                + Add Subcommand
                            </button>
                        </h3>
                        {cliConfig.subcommands.length === 0 && <p className="text-slate-500 mb-4 text-sm">No subcommands defined.</p>}
                        {cliConfig.subcommands.map(command => (
                            <CliCommandForm
                                key={command.id}
                                command={command}
                                onUpdate={updateSubcommand}
                                onRemove={removeSubcommand}
                                onAddArgument={addSubcommandArgument}
                                onUpdateArgument={updateSubcommandArgument}
                                onRemoveArgument={removeSubcommandArgument}
                                onAddOption={addSubcommandOption}
                                onUpdateOption={updateSubcommandOption}
                                onRemoveOption={removeSubcommandOption}
                            />
                        ))}
                    </div>
                </div>

                {/* Generated Code Panel */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-400 mb-2">Generated Code ({cliConfig.commandName}.js)</label>
                    <div className="relative flex-grow">
                        <pre className="w-full h-full bg-slate-900 p-4 rounded-md text-cyan-300 text-sm overflow-auto font-mono custom-scrollbar" aria-live="polite">
                            {generatedCode}
                        </pre>
                        <button
                            onClick={handleCopy}
                            className="absolute top-2 right-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs text-slate-200 transition-colors duration-200"
                            aria-label="Copy generated code to clipboard"
                        >
                            Copy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
```