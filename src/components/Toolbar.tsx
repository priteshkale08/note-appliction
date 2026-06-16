import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setSearch, setSort } from '../features/filters/filtersSlice';
import { createNote, selectSaving } from '../features/notes/notesSlice';
import type { SortKey } from '../types';

interface ToolbarProps {
    searchRef: React.RefObject<HTMLInputElement | null>;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'updatedAt', label: 'Last updated' },
    { value: 'createdAt', label: 'Date created' },
    { value: 'title', label: 'Title (A–Z)' }
];

const inputStyle = {
    background: 'var(--surface-2)',
    borderColor: 'var(--border)',
    color: 'var(--text)'
};

export function Toolbar({ searchRef }: ToolbarProps) {
    const dispatch = useAppDispatch();
    const search = useAppSelector((s) => s.filters.search);
    const sort = useAppSelector((s) => s.filters.sort);
    const saving = useAppSelector(selectSaving);

    return (
        <div
            className="flex gap-2 items-center px-3 py-2.5 shrink-0 border-b flex-wrap"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
            <div className="flex-1 min-w-[120px]">
                <input
                    ref={searchRef}
                    type="search"
                    value={search}
                    placeholder="Search…  (/)"
                    aria-label="Search notes"
                    className="w-full px-3 py-1.5 text-sm rounded-md border outline-none focus:border-indigo-500"
                    style={inputStyle}
                    onChange={(e) => dispatch(setSearch(e.target.value))}
                />
            </div>

            <select
                value={sort}
                aria-label="Sort notes"
                className="px-2 py-1.5 text-sm rounded-md border outline-none cursor-pointer shrink-0"
                style={inputStyle}
                onChange={(e) => dispatch(setSort(e.target.value as SortKey))}
            >
                {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            <button
                type="button"
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 text-white border-none cursor-pointer hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                disabled={saving}
                onClick={() =>
                    dispatch(createNote({ title: 'Untitled note', content: '', completed: false, tags: [] }))
                }
            >
                + New note
            </button>
        </div>
    );
}
