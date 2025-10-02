// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useMemo } from 'react';
import { CodeBracketSquareIcon } from '../icons/FeatureIcons.tsx';

const initialScss = `$primary-color: #06b6d4;\n\n.container {\n  padding: 20px;\n\n  .title {\n    color: $primary-color;\n    font-size: 24px;\n  }\n}`;

export const SassScssCompiler: React.FC = () => {
    const [scss, setScss] = useState(initialScss);

    const compiledCss = useMemo(() => {
        // This is a very basic simulation. A real implementation would use a SASS compiler.
        let css = scss.replace(/\$(\w+):\s*(.*?);/g, (_, name, value) => `--${name}: ${value};`);
        css = css.replace(/color:\s*\$(\w+);/g, 'color: var(--$1);');
        css = css.replace(/\.container\s*\{([\s\S]*?)\}/g, (match, content) => {
            const inner = content.replace(/\.title\s*\{([\s\S]*?)\}/g, (m, innerContent) => {
                return `\n.container .title {\n  ${innerContent.trim()}\n}`;
            });
            return `.container {\n  ${inner.trim().split('\n').slice(0,-1).join('\n')}\n}`;
        });
        return css;
    }, [scss]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <CodeBracketSquareIcon />
                    <span className="ml-3">SASS/SCSS Compiler (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A basic, real-time simulation of a SASS/SCSS to CSS compiler.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full">
                    <label htmlFor="scss-input" className="text-sm font-medium text-slate-400 mb-2">SASS/SCSS Input</label>
                    <textarea
                        id="scss-input"
                        value={scss}
                        onChange={(e) => setScss(e.target.value)}
                        className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-pink-400"
                    />
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Compiled CSS Output</label>
                    <pre className="flex-grow p-4 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto text-cyan-300 font-mono text-sm">
                        {compiledCss}
                    </pre>
                </div>
            </div>
        </div>
    );
};