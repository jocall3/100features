// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

// This file implements a sophisticated Changelog Generator component for a React application.
// It allows users to paste conventional commit messages and generates a formatted markdown changelog.
// The component is designed for enterprise-grade use, incorporating TypeScript for type safety,
// state management for user settings (persisted to local storage), and clear separation of concerns
// through helper functions for parsing and markdown generation. It supports a comprehensive set
// of conventional commit types, breaking changes, and customization options.

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GitBranchIcon } from '../icons/FeatureIcons';

// --- Types ---

/**
 * Interface for a conventional commit type definition.
 * Used to define the available commit types for changelog generation.
 */
export interface ICommitType {
    key: string; // e.g., 'feat', 'fix'
    label: string; // e.g., 'Features', 'Bug Fixes'
    emoji: string; // e.g., '✨', '🐛'
    description: string; // Brief description of the commit type
    defaultIncluded: boolean; // Whether this type is included by default in the changelog
}

/**
 * Interface for a parsed conventional commit message.
 * Represents a commit with its structured components.
 */
export interface ICommit {
    raw: string; // Original commit message string
    type: string; // e.g., 'feat', 'fix', 'chore'
    scope?: string; // e.g., 'api', 'button' (optional)
    description: string; // The main commit message description
    breakingChange: boolean; // True if the commit indicates a breaking change
    breakingChangeMessage?: string; // The specific breaking change message if present
}

/**
 * Interface for changelog generation settings.
 * These settings control how the markdown changelog is formatted.
 */
export interface IChangelogSettings {
    version: string;
    releaseDate: string;
    includeEmojis: boolean;
    includedCommitTypes: string[]; // Array of commit type keys to include in the changelog
    includeBreakingChangesSeparately: boolean; // Whether breaking changes should have their own section
}

// --- Constants & Defaults ---

/**
 * Defines all supported conventional commit types with their properties.
 * This array serves as the source of truth for commit types in the generator.
 */
export const ALL_COMMIT_TYPES: ICommitType[] = [
    { key: 'feat', label: 'Features', emoji: '✨', description: 'A new feature', defaultIncluded: true },
    { key: 'fix', label: 'Bug Fixes', emoji: '🐛', description: 'A bug fix', defaultIncluded: true },
    { key: 'perf', label: 'Performance Improvements', emoji: '⚡', description: 'A code change that improves performance', defaultIncluded: true },
    { key: 'refactor', label: 'Code Refactoring', emoji: '🔨', description: 'A code change that neither fixes a bug nor adds a feature', defaultIncluded: false },
    { key: 'docs', label: 'Documentation', emoji: '📝', description: 'Documentation only changes', defaultIncluded: false },
    { key: 'chore', label: 'Chores', emoji: '🧹', description: 'Other changes that don\'t modify src or test files', defaultIncluded: false },
    { key: 'style', label: 'Styles', emoji: '🎨', description: 'Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)', defaultIncluded: false },
    { key: 'test', label: 'Tests', emoji: '✅', description: 'Adding missing tests or correcting existing tests', defaultIncluded: false },
    { key: 'build', label: 'Build System', emoji: '📦', description: 'Changes that affect the build system or external dependencies', defaultIncluded: false },
    { key: 'ci', label: 'Continuous Integration', emoji: '🚀', description: 'Changes to our CI configuration files and scripts', defaultIncluded: false },
    { key: 'revert', label: 'Reverts', emoji: '⏪', description: 'Reverts a previous commit', defaultIncluded: true },
];

/**
 * Default settings for the changelog generator.
 * Used when no settings are found in local storage or when settings are reset.
 */
export const DEFAULT_CHANGELOG_SETTINGS: IChangelogSettings = {
    version: '1.0.0',
    releaseDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    includeEmojis: true,
    includedCommitTypes: ALL_COMMIT_TYPES.filter(t => t.defaultIncluded).map(t => t.key),
    includeBreakingChangesSeparately: true,
};

/**
 * Key used to store and retrieve changelog settings from browser's local storage.
 */
const LOCAL_STORAGE_SETTINGS_KEY = 'changelogGeneratorSettings';

/**
 * Sample commit messages to populate the input textarea initially.
 * Demonstrates various conventional commit types, scopes, and breaking changes.
 */
const sampleCommits = `feat: add user login page
fix: correct typo in header
docs: update readme with setup instructions
feat(api): implement user endpoint
chore: upgrade dependencies
fix(button): prevent double click
feat: implement responsive design for mobile views
perf(dashboard): optimize data fetching for summary widgets
refactor(auth): consolidate authentication logic
fix: resolve an issue where empty search queries crashed the app
BREAKING CHANGE: The user API now requires authentication. Please update your clients.
feat: add dark mode toggle
ci: update build pipeline to use Node.js 18
test(core): add unit tests for utility functions
feat(project): allow users to archive projects
`;

// --- Helper Functions for Commit Parsing and Changelog Generation ---

/**
 * Parses a single conventional commit message string into a structured `ICommit` object.
 * This function handles the primary conventional commit format (`type(scope): description`)
 * and can detect "BREAKING CHANGE" footers.
 *
 * @param commitMessage The raw commit message string.
 * @returns An `ICommit` object if parsing is successful, otherwise `null`.
 */
export const parseCommitMessage = (commitMessage: string): ICommit | null => {
    const originalMessage = commitMessage.trim();
    if (!originalMessage) return null;

    // Split the commit message into lines to find potential breaking change footers.
    const lines = originalMessage.split('\n');
    let breakingChange = false;
    let breakingChangeMessage: string | undefined;

    // Check for "BREAKING CHANGE:" in any line of the commit message.
    const footerIndex = lines.findIndex(line => line.startsWith('BREAKING CHANGE:'));
    if (footerIndex !== -1) {
        breakingChange = true;
        // Extract the breaking change message, removing the "BREAKING CHANGE:" prefix.
        breakingChangeMessage = lines.slice(footerIndex).join('\n').replace('BREAKING CHANGE:', '').trim();
    }

    // Process the header line (the first line of the commit message).
    const header = lines[0];
    // Regex to match conventional commit format: type(scope): description
    const headerMatch = header.match(/^(\w+)(?:\(([^)]+)\))?:\s(.+)$/);

    if (!headerMatch) {
        // If the header doesn't match the conventional commit format, return null.
        return null;
    }

    // Destructure matched groups from the regex.
    const [, type, scope, description] = headerMatch;

    return {
        raw: originalMessage,
        type: type.toLowerCase(),
        scope: scope ? scope.toLowerCase() : undefined, // Scope is optional and converted to lowercase
        description: description.trim(),
        breakingChange,
        breakingChangeMessage,
    };
};

/**
 * Groups an array of parsed `ICommit` objects by their commit type.
 *
 * @param commits An array of parsed `ICommit` objects.
 * @returns A `Map` where keys are commit type strings (e.g., 'feat', 'fix')
 *          and values are arrays of `ICommit` objects belonging to that type.
 */
export const groupCommitsByType = (commits: ICommit[]): Map<string, ICommit[]> => {
    const grouped = new Map<string, ICommit[]>();
    for (const commit of commits) {
        if (!grouped.has(commit.type)) {
            grouped.set(commit.type, []);
        }
        grouped.get(commit.type)?.push(commit);
    }
    return grouped;
};

/**
 * Generates the markdown changelog string based on an array of parsed commits and current settings.
 * This function orchestrates the formatting and ordering of the changelog sections.
 *
 * @param parsedCommits An array of parsed `ICommit` objects to include in the changelog.
 * @param settings The `IChangelogSettings` object dictating the output format.
 * @returns The complete markdown string for the changelog.
 */
export const generateChangelogMarkdown = (parsedCommits: ICommit[], settings: IChangelogSettings): string => {
    let md = `# Changelog\n\n`;

    // Add version and release date if available in settings.
    if (settings.version && settings.releaseDate) {
        md += `## [${settings.version}] - ${settings.releaseDate}\n\n`;
    }

    // Separate breaking changes from other commits.
    const breakingChanges = parsedCommits.filter(c => c.breakingChange);
    const nonBreakingCommits = parsedCommits.filter(c => !c.breakingChange);

    // 1. Render Breaking Changes section if enabled and present.
    if (settings.includeBreakingChangesSeparately && breakingChanges.length > 0) {
        md += `### 🚨 Breaking Changes\n\n`;
        breakingChanges.forEach(commit => {
            const scopePart = commit.scope ? `(${commit.scope})` : '';
            // Display the specific breaking change message if available, otherwise fallback to description.
            md += `- **${commit.type}${scopePart}:** ${commit.breakingChangeMessage || commit.description}\n`;
        });
        md += '\n';
    }

    // 2. Group and render other commit types based on settings.
    // Filter commits by the types the user wants to include.
    const groupedByType = groupCommitsByType(nonBreakingCommits.filter(c => settings.includedCommitTypes.includes(c.type)));

    // Sort commit types to maintain a consistent order in the changelog,
    // following the order defined in ALL_COMMIT_TYPES.
    const sortedCommitTypeKeys = ALL_COMMIT_TYPES
        .filter(t => settings.includedCommitTypes.includes(t.key))
        .map(t => t.key);

    for (const typeKey of sortedCommitTypeKeys) {
        const commitsOfType = groupedByType.get(typeKey);
        if (commitsOfType && commitsOfType.length > 0) {
            const commitTypeDefinition = ALL_COMMIT_TYPES.find(t => t.key === typeKey);
            if (!commitTypeDefinition) continue; // Should not happen if filtered correctly

            const emoji = settings.includeEmojis ? `${commitTypeDefinition.emoji} ` : '';
            md += `### ${emoji}${commitTypeDefinition.label}\n\n`;

            // Within each type, further group by scope.
            const groupedByScope = new Map<string, ICommit[]>();
            commitsOfType.forEach(commit => {
                const scopeKey = commit.scope || 'No Scope'; // Group commits without a scope under 'No Scope'
                if (!groupedByScope.has(scopeKey)) {
                    groupedByScope.set(scopeKey, []);
                }
                groupedByScope.get(scopeKey)?.push(commit);
            });

            // Sort scopes alphabetically, placing 'No Scope' at the end.
            const sortedScopes = Array.from(groupedByScope.keys()).sort((a, b) => {
                if (a === 'No Scope') return 1;
                if (b === 'No Scope') return -1;
                return a.localeCompare(b);
            });

            for (const scopeKey of sortedScopes) {
                const commitsInScope = groupedByScope.get(scopeKey);
                if (commitsInScope && commitsInScope.length > 0) {
                    // Add a sub-heading for scope if there are multiple scopes for a type,
                    // but not for the 'No Scope' group if it's the only one.
                    if (sortedScopes.length > 1 && scopeKey !== 'No Scope') {
                        md += `#### \`${scopeKey}\`\n\n`; // Use code block for scope for distinction
                    }
                    commitsInScope.forEach(commit => {
                        md += `- ${commit.description}\n`;
                    });
                }
            }
            md += '\n'; // Add an extra newline for spacing between types
        }
    }

    return md;
};

// --- Settings Panel Component ---

/**
 * `ChangelogSettingsPanel` is a sub-component that provides a user interface
 * for customizing the changelog generation settings.
 * It's a controlled component, receiving settings and a callback for changes.
 *
 * @param props.settings The current `IChangelogSettings` object.
 * @param props.onSettingsChange Callback function to update the settings in the parent component.
 */
export const ChangelogSettingsPanel: React.FC<{
    settings: IChangelogSettings;
    onSettingsChange: (newSettings: IChangelogSettings) => void;
}> = ({ settings, onSettingsChange }) => {
    // Handlers for individual setting changes, using useCallback for performance.
    const handleVersionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({ ...settings, version: e.target.value });
    }, [settings, onSettingsChange]);

    const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({ ...settings, releaseDate: e.target.value });
    }, [settings, onSettingsChange]);

    const handleEmojiToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({ ...settings, includeEmojis: e.target.checked });
    }, [settings, onSettingsChange]);

    const handleBreakingChangesToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({ ...settings, includeBreakingChangesSeparately: e.target.checked });
    }, [settings, onSettingsChange]);

    const handleCommitTypeToggle = useCallback((key: string, checked: boolean) => {
        const newIncludedTypes = checked
            ? [...settings.includedCommitTypes, key]
            : settings.includedCommitTypes.filter(type => type !== key);
        onSettingsChange({ ...settings, includedCommitTypes: newIncludedTypes });
    }, [settings, onSettingsChange]);

    return (
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-md">
            <h3 className="text-xl font-semibold text-slate-100 mb-4">Generator Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="version-input" className="block text-sm font-medium text-slate-400 mb-1">Version</label>
                    <input
                        id="version-input"
                        type="text"
                        value={settings.version}
                        onChange={handleVersionChange}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="Changelog Version"
                        placeholder="e.g., 1.0.0"
                    />
                </div>
                <div>
                    <label htmlFor="release-date-input" className="block text-sm font-medium text-slate-400 mb-1">Release Date</label>
                    <input
                        id="release-date-input"
                        type="date"
                        value={settings.releaseDate}
                        onChange={handleDateChange}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="Changelog Release Date"
                    />
                </div>
            </div>

            <div className="mb-4 space-y-2">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-indigo-500 transition duration-150 ease-in-out bg-slate-900 border-slate-600 rounded"
                        checked={settings.includeEmojis}
                        onChange={handleEmojiToggle}
                        aria-label="Include Emojis in changelog"
                    />
                    <span className="ml-2 text-sm text-slate-300">Include Emojis</span>
                </label>

                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-indigo-500 transition duration-150 ease-in-out bg-slate-900 border-slate-600 rounded"
                        checked={settings.includeBreakingChangesSeparately}
                        onChange={handleBreakingChangesToggle}
                        aria-label="List Breaking Changes in a separate section"
                    />
                    <span className="ml-2 text-sm text-slate-300">List Breaking Changes Separately</span>
                </label>
            </div>

            <div className="mb-4">
                <h4 className="text-md font-medium text-slate-300 mb-2">Include Commit Types:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_COMMIT_TYPES.map((type) => (
                        <label key={type.key} className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-indigo-500 transition duration-150 ease-in-out bg-slate-900 border-slate-600 rounded"
                                checked={settings.includedCommitTypes.includes(type.key)}
                                onChange={(e) => handleCommitTypeToggle(type.key, e.target.checked)}
                                aria-label={`Toggle inclusion of ${type.label} commits`}
                            />
                            <span className="ml-2 text-sm text-slate-300" title={type.description}>{type.emoji} {type.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Main Changelog Generator Component ---

/**
 * `ChangelogGenerator` is the root component for the changelog generation application.
 * It integrates the commit input, settings panel, and changelog output.
 * It manages the application's core state including commit messages and generator settings,
 * and handles persistence of settings to local storage.
 */
export const ChangelogGenerator: React.FC = () => {
    // State for the raw commit messages input by the user.
    const [commitsInput, setCommitsInput] = useState<string>(sampleCommits);
    // State for the changelog generation settings, initialized from local storage or defaults.
    const [settings, setSettings] = useState<IChangelogSettings>(() => {
        try {
            const savedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
            if (savedSettings) {
                const parsedSettings: Partial<IChangelogSettings> = JSON.parse(savedSettings);

                // Merge saved settings with default settings to ensure all properties exist
                // and to gracefully handle schema changes (e.g., new commit types).
                return {
                    ...DEFAULT_CHANGELOG_SETTINGS,
                    ...parsedSettings,
                    // Ensure includedCommitTypes is an array and contains only valid keys from ALL_COMMIT_TYPES.
                    // Also, merge with default included types to automatically enable new defaults.
                    includedCommitTypes: Array.from(new Set([
                        ...(parsedSettings.includedCommitTypes || []),
                        ...DEFAULT_CHANGELOG_SETTINGS.includedCommitTypes,
                    ])).filter(typeKey => ALL_COMMIT_TYPES.some(t => t.key === typeKey)),
                };
            }
        } catch (error) {
            console.error("Failed to load changelog settings from localStorage, using defaults:", error);
            // Fallback to default settings if loading fails (e.g., malformed JSON).
        }
        return DEFAULT_CHANGELOG_SETTINGS;
    });

    // Effect hook to persist settings to local storage whenever they change.
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save changelog settings to localStorage:", error);
        }
    }, [settings]); // Re-run effect whenever `settings` state changes.

    // Callback for when settings are changed in the ChangelogSettingsPanel.
    const handleSettingsChange = useCallback((newSettings: IChangelogSettings) => {
        setSettings(newSettings);
    }, []);

    // Memoized array of parsed commit objects. Re-parsed only when `commitsInput` changes.
    const parsedCommits = useMemo(() => {
        return commitsInput.split('\n')
            .map(line => parseCommitMessage(line))
            .filter((commit): commit is ICommit => commit !== null); // Type guard to filter out nulls
    }, [commitsInput]);

    // Memoized generated changelog markdown string. Re-generated only when `parsedCommits` or `settings` change.
    const generatedChangelog = useMemo(() => {
        return generateChangelogMarkdown(parsedCommits, settings);
    }, [parsedCommits, settings]);

    // Callback to copy the generated changelog to the clipboard.
    const handleCopyClick = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(generatedChangelog);
            // TODO: Provide visual feedback (e.g., a toast notification) for successful copy.
        } catch (err) {
            console.error('Failed to copy changelog: ', err);
            // TODO: Provide visual feedback (e.g., an error message) for copy failure.
        }
    }, [generatedChangelog]);

    // Callback to reset the commit input to the sample commits.
    const handleResetCommits = useCallback(() => {
        setCommitsInput(sampleCommits);
    }, []);

    // Callback to reset the generator settings to their default values.
    const handleResetSettings = useCallback(() => {
        setSettings(DEFAULT_CHANGELOG_SETTINGS);
    }, []);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-200">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    {/* Enhanced GitBranchIcon with custom styling */}
                    <GitBranchIcon className="h-8 w-8 text-indigo-400" aria-hidden="true" />
                    <span className="ml-3">Changelog Generator</span>
                </h1>
                <p className="text-slate-400 mt-1">Generate a structured markdown changelog from conventional commit messages. Customize output with granular settings.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 xl:grid-cols-3 gap-6 h-full overflow-hidden">
                {/* Commit Input Section */}
                <section className="flex flex-col h-full xl:col-span-1" aria-labelledby="commit-input-label">
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="commit-input" id="commit-input-label" className="text-sm font-medium text-slate-400">Commit Messages (one per line)</label>
                        <button
                            onClick={handleResetCommits}
                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs text-slate-300 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                            aria-label="Reset commit messages to sample"
                        >
                            Reset Input
                        </button>
                    </div>
                    <textarea
                        id="commit-input"
                        value={commitsInput}
                        onChange={(e) => setCommitsInput(e.target.value)}
                        className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 custom-scrollbar"
                        placeholder="Paste your conventional commit messages here (e.g., feat: add feature, fix(scope): fix bug, BREAKING CHANGE: message)"
                        aria-describedby="commit-input-description"
                        spellCheck="false"
                    />
                    <p id="commit-input-description" className="sr-only">Enter conventional commit messages, one per line.</p>
                </section>

                {/* Settings and Generated Changelog Sections */}
                <div className="flex flex-col h-full xl:col-span-2 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                        {/* Settings Panel */}
                        <section className="flex flex-col h-full lg:col-span-1" aria-labelledby="settings-label">
                            <div className="flex justify-between items-center mb-2">
                                <span id="settings-label" className="text-sm font-medium text-slate-400">Generator Settings</span>
                                <button
                                    onClick={handleResetSettings}
                                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs text-slate-300 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                                    aria-label="Reset generator settings to default"
                                >
                                    Reset Settings
                                </button>
                            </div>
                            <div className="flex-grow overflow-y-auto custom-scrollbar">
                                <ChangelogSettingsPanel settings={settings} onSettingsChange={handleSettingsChange} />
                            </div>
                        </section>

                        {/* Generated Changelog Output */}
                        <section className="flex flex-col h-full lg:col-span-1" aria-labelledby="changelog-output-label">
                            <label id="changelog-output-label" className="text-sm font-medium text-slate-400 mb-2">Generated Changelog.md</label>
                            <div className="relative flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto custom-scrollbar" aria-live="polite">
                                <pre className="whitespace-pre-wrap font-sans text-slate-200">{generatedChangelog}</pre>
                                <button
                                    onClick={handleCopyClick}
                                    className="absolute top-2 right-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-xs text-slate-300 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                                    aria-label="Copy generated changelog to clipboard"
                                >
                                    Copy
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};