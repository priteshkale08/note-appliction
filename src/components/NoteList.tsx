import { useAppSelector } from '../app/hooks';
import { selectFilteredNotes, selectNotesError, selectNotesStatus } from '../features/notes/notesSlice';
import NoteListItem from './NoteListItem';

interface NoteListProps {
    onRetry: () => void;
}

export default function NoteList({ onRetry }: NoteListProps) {
    const notes = useAppSelector(selectFilteredNotes);
    const status = useAppSelector(selectNotesStatus);
    const error = useAppSelector(selectNotesError);

    if (status === 'loading' && notes.length === 0) {
        return (
            <div
                className="flex flex-col flex-1 items-center justify-center gap-3 p-10 text-sm"
                style={{ color: 'var(--text-muted)' }}
                role="status"
                aria-live="polite"
            >
                <div className="spinner" aria-hidden="true" />
                <p className="m-0">Loading notes…</p>
            </div>
        );
    }

    if (status === 'failed' && notes.length === 0) {
        return (
            <div
                className="flex flex-col flex-1 items-center justify-center gap-3 p-10 text-sm text-center"
                style={{ color: 'var(--text-muted)' }}
                role="alert"
            >
                <p className="m-0">{error ?? 'Could not load notes.'}</p>
                <button
                    type="button"
                    className="px-4 py-2 text-sm rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                        background: 'var(--surface-2)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)'
                    }}
                    onClick={onRetry}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (notes.length === 0) {
        return (
            <div
                className="flex flex-col flex-1 items-center justify-center gap-2 p-10 text-center"
                style={{ color: 'var(--text-muted)' }}
                role="status"
            >
                <p className="text-base font-semibold m-0">No notes yet</p>
                <p className="text-sm m-0">Press "New note" or hit "n" to create your first one.</p>
            </div>
        );
    }
    
    return (
        <ul
            className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 list-none m-0"
            aria-label="Notes"
        >
            {notes.map((note) => (
                <li key={note.id}>
                    <NoteListItem key={note.id} note={note} />
                </li>
            ))}
        </ul>
    )
}
