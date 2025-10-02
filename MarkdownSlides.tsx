// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import { PhotoIcon } from '../icons/FeatureIcons.tsx';

const exampleMarkdown = `# Slide 1: Welcome

This is a slide deck generated from Markdown.

- Use standard markdown syntax
- Like lists, headers, and **bold** text.

---

# Slide 2: Features

Navigate using the buttons below.

\`\`\`javascript
console.log("Code blocks work too!");
\`\`\`

---

# Slide 3: The End

Easy to create and present.
`;

export const MarkdownSlides: React.FC = () => {
    const [markdown, setMarkdown] = useState(exampleMarkdown);
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = useMemo(() => markdown.split(/^-{3,}\s*$/m), [markdown]);

    const goToNext = () => setCurrentSlide(s => Math.min(s + 1, slides.length - 1));
    const goToPrev = () => setCurrentSlide(s => Math.max(s - 1, 0));

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <PhotoIcon />
                    <span className="ml-3">Markdown to Slides</span>
                </h1>
                <p className="text-slate-400 mt-1">Write markdown, present it as a slideshow. Use '---' to separate slides.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full">
                     <label htmlFor="md-input" className="text-sm font-medium text-slate-400 mb-2">Markdown Editor</label>
                     <textarea
                        id="md-input"
                        value={markdown}
                        onChange={e => setMarkdown(e.target.value)}
                        className="flex-grow p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                </div>
                 <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-slate-400 mb-2">Presentation View</label>
                    <div className="relative flex-grow flex flex-col justify-center items-center p-8 bg-slate-800/50 border border-slate-700/50 rounded-md overflow-y-auto">
                        <div
                            className="prose prose-lg prose-invert max-w-none w-full"
                            dangerouslySetInnerHTML={{ __html: marked(slides[currentSlide] || '') }}
                        />
                         <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                            <button onClick={goToPrev} disabled={currentSlide === 0} className="px-4 py-2 bg-slate-700 rounded-md disabled:opacity-50">Prev</button>
                            <span className="text-sm text-slate-400">{currentSlide + 1} / {slides.length}</span>
                            <button onClick={goToNext} disabled={currentSlide === slides.length - 1} className="px-4 py-2 bg-slate-700 rounded-md disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};