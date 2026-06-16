import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectNote, selectSelectedId } from "../features/notes/notesSlice";
import type { Note } from "../types";
import { formatRelative } from "../utils/date";
import { Check } from "lucide-react";

interface NoteListItemProps {
    note: Note;
}

function preview(content: string): string {
    const text = content
        .replace(/[#*`>_-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

export default function NoteListItem({ note }: NoteListItemProps) {
    const dispatch = useAppDispatch();
    const selectedId = useAppSelector(selectSelectedId);
    const isSelected = selectedId === note.id;
    const isPending = note.id.startsWith('temp-');
    
    return (
        <li>
            <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => dispatch(selectNote(note.id))}
                className={[
                    'bg-(--surface) w-full text-left rounded-lg border border-(--border) px-3.5 py-3 flex flex-col gap-1.5 cursor-pointer transition-all bg-(--surface) text-(--text)',
                    isSelected
                        ? 'border-indigo-500 shadow-[0_0_0_1px_#6366f1]'
                        : 'hover:border-indigo-400 hover:bg-(--surface-2)'
                ].join(' ')}
            >
                <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-[15px] m-0 truncate flex-1">
                        {note.title || 'Untitled note'}
                    </h3>
                    {isPending && (
                        <span className="text-[11px] italic text-indigo-500 shrink-0">Saving…</span>
                    )}
                    {note.completed && (
                        <span className="text-[11px] text-green-600 shrink-0"><Check size={18} /></span>
                    )}
                </div>
                <p
                    className="text-[13px] m-0 line-clamp-2 text-(--text-muted)"
                >
                    {preview(note.content) || 'No content yet'}
                </p>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[12px] whitespace-nowrap text-(--text-muted)">
                        {formatRelative(note.updatedAt)}
                    </span>
                    {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {note.tags.slice(0, 3).map((t) => (
                                <span
                                    key={t}
                                    className="text-[11px] px-2 py-0.5 rounded-full border border-(--border) bg-(--surface-2) text-(--text-muted)"
                                >
                                    #{t}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </button>
        </li>
    )
}
