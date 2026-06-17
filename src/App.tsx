import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { NoteEditor } from './components/NoteEditor';
import NoteList from './components/NoteList';
import { TagFilter } from './components/TagFilter';
import { Toolbar } from './components/Toolbar';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
    clearError,
    createNote,
    fetchNotes,
    selectNote,
    selectSelectedId,
    selectNotesError,
    selectSaving,
} from './features/notes/notesSlice';
import { Moon, NotebookPen, Plus, Sun } from 'lucide-react';

export default function App() {
    const dispatch = useAppDispatch();
    const selectedId = useAppSelector(selectSelectedId);
    const saving = useAppSelector(selectSaving);
    const error = useAppSelector(selectNotesError);
    const online = useOnlineStatus();
    const searchRef = useRef<HTMLInputElement>(null);

    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('theme');
        if (stored) return stored === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const toggleTheme = useCallback(() => {
        setIsDark((prev) => {
            const next = !prev;
            localStorage.setItem('theme', next ? 'dark' : 'light');
            return next;
        });
    }, []);

    const loadNotes = useCallback(() => {
        dispatch(fetchNotes({}));
    }, [dispatch]);

    useEffect(() => {
        loadNotes();
    }, [dispatch]);

    useEffect(() => {
        if (online) loadNotes();
    }, [online]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const typing =
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

            if (e.key === '/' && !typing) {
                e.preventDefault();
                searchRef.current?.focus();
            } else if ((e.key === 'n' || e.key === 'N') && !typing) {
                e.preventDefault();
                dispatch(createNote({ title: 'Untitled note', content: '', completed: false, tags: [] }));
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [dispatch]);

    const handleBack = useCallback(() => dispatch(selectNote(null)), [dispatch]);

    return (
        <div className={`flex flex-col h-screen bg-(--bg) text-(--text)${isDark ? ' dark' : ''}`}>
            <header className="flex items-center justify-between gap-3 px-4 py-3 shrink-0 bg-(--surface) border-b border-(--border)">
                <h1 className="text-xl font-bold text-(--text) flex items-center gap-2">
                    <NotebookPen size={24} color="#4f39f6" /> Note Application
                </h1>

                {!online && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                        Offline — changes will retry when reconnected
                    </span>
                )}

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 text-white border-none cursor-pointer hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        disabled={saving}
                        aria-label="New note"
                        onClick={() =>
                            dispatch(createNote({ title: 'Untitled note', content: '', completed: false, tags: [] }))
                        }
                    >
                        <Plus size={15} /> New note
                    </button>

                    <button
                        type="button"
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        onClick={toggleTheme}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-(--border) text-(--text) hover:bg-(--surface-2) focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors cursor-pointer"
                    >
                        {isDark ? <Sun size={15} /> : <Moon size={15} />}
                    </button>
                </div>
            </header>

            {error && (
                <div
                    className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg z-50 text-sm text-white bg-red-600 whitespace-nowrap"
                    role="alert"
                >
                    <span>{error}</span>
                    <button
                        type="button"
                        className="border-none bg-transparent text-white text-xl leading-none p-0 cursor-pointer"
                        aria-label="Dismiss error"
                        onClick={() => dispatch(clearError())}
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(280px,1fr)_minmax(360px,1.6fr)] lg:grid-cols-[220px_minmax(280px,1fr)_minmax(360px,1.6fr)]">
                <aside className="hidden lg:flex flex-col overflow-y-auto p-3 bg-(--surface) border-r border-(--border)">
                    <TagFilter />
                </aside>

                <main 
                    className={[
                        'flex flex-col min-h-0 bg-(--surface) border-r border-(--border)',
                        selectedId ? 'hidden md:flex' : 'flex'
                    ].join(' ')}
                >
                    <Toolbar searchRef={searchRef} />
                    <NoteList onRetry={loadNotes} />
                </main>

                <section 
                    className={[
                        'flex flex-col min-h-0 overflow-y-auto bg-(--surface)',
                        selectedId ? 'flex' : 'hidden md:flex'
                    ].join(' ')}
                >
                    <NoteEditor onBack={handleBack} />
                </section>
            </div>
        </div>
    );
}
