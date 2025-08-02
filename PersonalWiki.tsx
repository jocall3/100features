import React, { useState, useEffect } from 'react';
import { FileCodeIcon } from '../icons/FeatureIcons.tsx';
import { marked } from 'marked';

interface Page {
    id: number;
    title: string;
    content: string;
}

const useLocalStorage = (key: string, initialValue: any) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) { return initialValue; }
    });
    const setValue = (value: any) => {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
    };
    return [storedValue, setValue];
};

export const PersonalWiki: React.FC = () => {
    const [pages, setPages] = useLocalStorage('devcore_wiki', [{ id: 1, title: 'Welcome', content: '# Welcome to your personal wiki!'}]);
    const [activePage, setActivePage] = useState<Page | null>(pages[0] || null);

    const handleSelectPage = (page: Page) => setActivePage(page);
    
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!activePage) return;
        const updatedPage = { ...activePage, content: e.target.value };
        setActivePage(updatedPage);
        setPages(pages.map((p: Page) => p.id === updatedPage.id ? updatedPage : p));
    };

    const handleAddNew = () => {
        const title = prompt("Enter new page title:");
        if (title) {
            const newPage = { id: Date.now(), title, content: `# ${title}\n\nStart writing here.` };
            setPages([...pages, newPage]);
            setActivePage(newPage);
        }
    };
    
    const handleDelete = (id: number) => {
        setPages(pages.filter((p: Page) => p.id !== id));
        if (activePage?.id === id) setActivePage(null);
    }

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <FileCodeIcon />
                    <span className="ml-3">Personal Wiki</span>
                </h1>
                <p className="text-slate-400 mt-1">A simple markdown-based wiki stored in your browser.</p>
            </header>
            <div className="flex-grow flex gap-6 min-h-0">
                <aside className="w-1/3 bg-slate-800/50 p-4 rounded-lg flex flex-col">
                    <h3 className="font-bold mb-2">Pages</h3>
                    <ul className="space-y-1 flex-grow overflow-y-auto">
                        {pages.map((page: Page) => (
                            <li key={page.id} className="group flex items-center justify-between">
                                <button onClick={() => handleSelectPage(page)} className={`w-full text-left px-3 py-2 rounded-md ${activePage?.id === page.id ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-700/50'}`}>
                                    {page.title}
                                </button>
                                <button onClick={() => handleDelete(page.id)} className="ml-2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100">&times;</button>
                            </li>
                        ))}
                    </ul>
                     <button onClick={handleAddNew} className="w-full text-sm mt-4 pt-4 border-t border-slate-700 py-2 bg-cyan-500/80 text-white rounded-md">Add New Page</button>
                </aside>
                <main className="w-2/3 grid grid-cols-2 gap-4">
                    {activePage ? (
                        <>
                            <textarea
                                value={activePage.content}
                                onChange={handleContentChange}
                                className="h-full p-4 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-sm"
                            />
                            <div className="h-full p-4 bg-slate-900 border border-slate-700 rounded-md overflow-y-auto prose prose-sm prose-invert" dangerouslySetInnerHTML={{__html: marked(activePage.content)}}></div>
                        </>
                    ) : (
                        <div className="col-span-2 flex items-center justify-center bg-slate-900 rounded-lg text-slate-500">
                            Select a page or create a new one.
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};