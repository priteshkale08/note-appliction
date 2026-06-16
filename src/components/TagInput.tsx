import { HARDCODED_TAGS } from '../features/notes/notesSlice';

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
}

export function TagInput({ tags, onChange }: TagInputProps) {
    const toggle = (tag: string) => {
        if (tags.includes(tag)) {
            onChange(tags.filter((t) => t !== tag));
        } else {
            onChange([...tags, tag]);
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-(--text-muted)">
                Tags
            </span>
            <ul className="list-none m-0 p-0 flex flex-wrap gap-1.5">
                {HARDCODED_TAGS.map((tag) => {
                    const active = tags.includes(tag);
                    return (
                        <li key={tag}>
                            <button
                                type="button"
                                aria-pressed={active}
                                onClick={() => toggle(tag)}
                                className={[
                                    'text-[12px] px-2.5 py-0.5 rounded-full border cursor-pointer transition-all',
                                    active
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-transparent border-(--border) text-(--text-muted) opacity-60 hover:opacity-100 hover:bg-(--surface-2)'
                                ].join(' ')}
                            >
                                #{tag}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
