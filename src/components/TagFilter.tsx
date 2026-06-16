import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setTag } from '../features/filters/filtersSlice';
import { HARDCODED_TAGS } from '../features/notes/notesSlice';

export function TagFilter() {
    const dispatch = useAppDispatch();
    const activeTag = useAppSelector((s) => s.filters.tag);

    return (
        <nav className="flex flex-col gap-0.5" aria-label="Filter by tag">
            <h2
                className="text-[11px] font-semibold uppercase tracking-widest px-2 mb-2"
                style={{ color: 'var(--text-muted)' }}
            >
                Tags
            </h2>
            <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
                <li>
                    <button
                        type="button"
                        aria-pressed={activeTag === null}
                        onClick={() => dispatch(setTag(null))}
                        className={[
                            'w-full text-left px-2.5 py-1.5 rounded-md text-sm border-none cursor-pointer transition-colors',
                            activeTag === null
                                ? 'bg-indigo-600 text-white'
                        : 'bg-transparent hover:bg-(--surface-2)'
                    ].join(' ')}
                        style={{ color: activeTag === null ? '#fff' : 'var(--text)' }}
                    >
                        All notes
                    </button>
                </li>
                {HARDCODED_TAGS.map((tag) => {
                    const active = activeTag === tag;
                    return (
                        <li key={tag}>
                            <button
                                type="button"
                                aria-pressed={active}
                                onClick={() => dispatch(setTag(active ? null : tag))}
                                className={[
                                    'w-full text-left px-2.5 py-1.5 rounded-md text-sm border-none cursor-pointer transition-colors',
                                    active
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-transparent hover:bg-(--surface-2)'
                                ].join(' ')}
                                style={{ color: active ? '#fff' : 'var(--text)' }}
                            >
                                #{tag}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
