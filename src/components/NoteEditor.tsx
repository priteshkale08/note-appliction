import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectSaving, selectSelectedNote } from '../features/notes/notesSlice';
import { deleteNoteRequest, updateNoteRequest } from '../features/notes/notesSaga';
import { useDebounce } from '../hooks/useDebounce';
import { renderMarkdown } from '../utils/markdown';
import { ConfirmDialog } from './ConfirmDialog';
import { TagInput } from './TagInput';
import { ArrowLeft } from 'lucide-react';

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
    const [showPreview, setShowPreview] = useState(true);
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
        dispatch(updateNoteRequest({ id: note.id, input: debouncedForm }));
    }, [debouncedForm]);

    const previewHtml = useMemo(() => renderMarkdown(form.content), [form.content]);

    if (!note) {
        return (
            <section
                className="flex flex-col items-center justify-center flex-1 gap-2 p-8 text-center"
                aria-label="Note editor"
            >
                <p className="text-base font-semibold m-0 text-(--text)">Select a note</p>
                <p className="text-sm m-0 text-(--text-muted)">
                    Choose a note from the list, or create a new one.
                </p>
            </section>
        );
    }

    const hasUnsaved = signature(form) !== lastSavedRef.current;

    const saveLabel = isPending ? 'Creating…' : saving ? 'Saving…' : hasUnsaved ? 'Unsaved…' : 'Saved';

    return (
        <section className="flex flex-col flex-1 min-h-0" aria-label="Note editor">
            <header className="shrink-0 flex justify-between gap-2 px-4 py-3 border-b border-(--border)">
                <div className="flex items-center gap-2">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="md:hidden shrink-0 text-indigo-600 font-medium text-sm bg-transparent border-none cursor-pointer p-0"
                        >
                            <ArrowLeft />
                        </button>
                    )}

                    <span className="text-xs shrink-0 text-(--text-muted)">
                        {saveLabel}
                    </span>

                    <label
                        className="flex items-center gap-1.5 text-sm cursor-pointer select-none shrink-0"
                    >
                        <input
                            type="checkbox"
                            checked={form.completed}
                            onChange={(e) => setForm((f) => ({ ...f, completed: e.target.checked }))}
                            className="accent-indigo-600 w-4 h-4"
                        />
                        Mark as completed
                    </label>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            type="button"
                            className="px-3 py-1.5 text-sm rounded-md border border-(--border) text-(--text) bg-transparent hover:bg-(--surface-2) cursor-pointer transition-colors"
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
                <div className="flex flex-col items-center gap-2 shrink-0">
                    <input
                        className="w-full text-lg font-medium rounded-md p-2 text-(--text) border border-(--border) outline-none focus:border-indigo-500"
                        value={form.title}
                        placeholder="Untitled note"
                        aria-label="Note title"
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                </div>

                {showPreview ? (
                    <div
                        className="flex-1 overflow-y-auto rounded-md p-4 text-sm leading-relaxed markdown-body bg-(--surface-2) text-(--text)"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                ) : (
                    <textarea
                        className="editor-textarea flex-1 min-h-[200px] rounded-md p-3 text-sm leading-relaxed bg-(--surface-2) text-(--text) border border-(--border) outline-none focus:border-indigo-500 resize-none"
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
                    dispatch(deleteNoteRequest(note.id));
                }}
            />
        </section>
    );
}
