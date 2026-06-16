import { useCallback, useEffect, useRef } from 'react';
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
    selectNotesError,
    selectSelectedId
} from './features/notes/notesSlice';

export default function App() {
    const dispatch = useAppDispatch();
    const selectedId = useAppSelector(selectSelectedId);
    const error = useAppSelector(selectNotesError);
    const online = useOnlineStatus();
    const searchRef = useRef<HTMLInputElement>(null);

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
        <div className="flex flex-col h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
            <header className="flex items-center gap-3 px-4 py-3 shrink-0 border-b">
                <h1 className="text-xl font-bold">Note Application</h1>

                {!online && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        Offline — changes will retry when reconnected
                    </span>
                )}
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

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[220px_minmax(280px,1fr)_minmax(360px,1.6fr)]">
                <aside className="hidden lg:flex flex-col border-r overflow-y-auto p-3">
                    <TagFilter />
                </aside>

                <main className="flex flex-col border-r min-h-0">
                    <Toolbar searchRef={searchRef} />
                    <NoteList onRetry={loadNotes} />
                </main>

                <section className="flex flex-col min-h-0 overflow-y-auto">
                    <NoteEditor onBack={handleBack} />
                </section>
            </div>
        </div>
    )
}
