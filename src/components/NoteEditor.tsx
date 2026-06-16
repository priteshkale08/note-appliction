import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { deleteNote, selectSaving, selectSelectedNote, updateNote } from '../features/notes/notesSlice';
import { useDebounce } from '../hooks/useDebounce';
import { renderMarkdown } from '../utils/markdown';
import { ConfirmDialog } from './ConfirmDialog';
import { TagInput } from './TagInput';

interface EditorForm {
    title: string;
    content: string;
    completed: boolean;
    tags: string[];
}

interface NoteEditorProps {
    onBack?: () => void;
}

function signature(form: EditorForm): string {
    return JSON.stringify(form);
}

export function NoteEditor({ onBack }: NoteEditorProps) {
    const dispatch = useAppDispatch();
    const note = useAppSelector(selectSelectedNote);
    const saving = useAppSelector(selectSaving);

    const [form, setForm] = useState<EditorForm>({ title: '', content: '', completed: false, tags: [] });
    const [showPreview, setShowPreview] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const lastSavedRef = useRef<string>('');
    const isPending = note?.id.startsWith('temp-') ?? false;

    useEffect(() => {
        if (note) {
            const next = { title: note.title, content: note.content, completed: note.completed, tags: note.tags };
            setForm(next);
            lastSavedRef.current = signature(next);
        }
    }, [note?.id]);

    const debouncedForm = useDebounce(form, 600);

    useEffect(() => {
        if (!note || isPending) return;
        const sig = signature(debouncedForm);
        if (sig === lastSavedRef.current) return;
        lastSavedRef.current = sig;
        dispatch(updateNote({ id: note.id, input: debouncedForm }));
    }, [debouncedForm]);

    const previewHtml = useMemo(() => renderMarkdown(form.content), [form.content]);

    if (!note) {
        return (
            <section
                className="flex flex-col items-center justify-center flex-1 gap-2 p-8 text-center"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Note editor"
            >
                <p className="text-base font-semibold m-0">Select a note</p>
                <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
                    Choose a note from the list, or create a new one.
                </p>
            </section>
        );
    }

    const hasUnsaved = signature(form) !== lastSavedRef.current;

    const saveLabel = isPending ? 'Creating…' : saving ? 'Saving…' : hasUnsaved ? 'Unsaved…' : 'Saved';

    return (
        <section className="flex flex-col flex-1 min-h-0" aria-label="Note editor">
            <header
                className="shrink-0 flex flex-col gap-2 px-4 py-3 border-b"
                style={{ borderColor: 'var(--border)' }}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="md:hidden shrink-0 text-indigo-600 font-medium text-sm bg-transparent border-none cursor-pointer p-0"
                        >
                            ←
                        </button>
                    )}
                    <input
                        className="flex-1 min-w-0 text-xl font-bold border-none bg-transparent outline-none"
                        style={{ color: 'var(--text)' }}
                        value={form.title}
                        placeholder="Untitled note"
                        aria-label="Note title"
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {saveLabel}
                    </span>

                    <label
                        className="flex items-center gap-1.5 text-sm cursor-pointer select-none shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <input
                            type="checkbox"
                            checked={form.completed}
                            onChange={(e) => setForm((f) => ({ ...f, completed: e.target.checked }))}
                            className="accent-indigo-600 w-4 h-4"
                        />
                        Done
                    </label>

                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            type="button"
                            className="px-3 py-1.5 text-sm rounded-md border cursor-pointer"
                            style={{
                                background: 'var(--surface-2)',
                                borderColor: 'var(--border)',
                                color: 'var(--text)'
                            }}
                            aria-pressed={showPreview}
                            onClick={() => setShowPreview((p) => !p)}
                        >
                            {showPreview ? 'Edit' : 'Preview'}
                        </button>
                        <button
                            type="button"
                            className="px-3 py-1.5 text-sm rounded-md border border-red-500 text-red-600 bg-transparent cursor-pointer hover:bg-red-600 hover:text-white transition-colors"
                            onClick={() => setConfirmOpen(true)}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex flex-col min-h-0 px-4 py-3 gap-3">
                {showPreview ? (
                    <div
                        className="flex-1 overflow-y-auto rounded-md border p-4 text-sm leading-relaxed markdown-body"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                ) : (
                    <textarea
                        className="editor-textarea flex-1 min-h-[200px] rounded-md border p-3 text-sm leading-relaxed"
                        style={{
                            background: 'var(--surface-2)',
                            borderColor: 'var(--border)',
                            color: 'var(--text)'
                        }}
                        value={form.content}
                        placeholder="Start writing… Markdown is supported."
                        aria-label="Note content"
                        onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    />
                )}

                <div className="shrink-0 pb-2">
                    <TagInput tags={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} />
                </div>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                title="Delete note?"
                message={`"${note.title || 'Untitled note'}" will be permanently removed.`}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={() => {
                    setConfirmOpen(false);
                    dispatch(deleteNote(note.id));
                }}
            />
        </section>
    );
}
