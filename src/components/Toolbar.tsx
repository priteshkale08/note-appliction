import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setSearch, setSort } from '../features/filters/filtersSlice';
import type { SortKey } from '../types';

interface ToolbarProps {
    searchRef: React.RefObject<HTMLInputElement | null>;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'updatedAt', label: 'Last updated' },
    { value: 'createdAt', label: 'Date created' },
    { value: 'title', label: 'Title (A–Z)' },
    { value: 'completed', label: 'Completed' }
];

export function Toolbar({ searchRef }: ToolbarProps) {
    const dispatch = useAppDispatch();
    const search = useAppSelector((state) => state.filters.search);
    const sort = useAppSelector((state) => state.filters.sort);

    

    return (
        <div className="flex gap-2 items-center px-3 py-2.5 shrink-0 flex-wrap border-b border-(--border)">
            <div className="flex-1 min-w-[120px]">
                <input
                    ref={searchRef}
                    type="search"
                    value={search}
                    placeholder="Search…  (/)"
                    aria-label="Search notes"
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-(--border) bg-(--surface-2) text-(--text) outline-none focus:border-indigo-500"
                    onChange={(e) => dispatch(setSearch(e.target.value))}
                />
            </div>

            <select
                value={sort}
                aria-label="Sort notes"
                className="px-2 py-1.5 text-sm rounded-md border border-(--border) bg-(--surface-2) text-(--text) outline-none cursor-pointer shrink-0"
                onChange={(e) => dispatch(setSort(e.target.value as SortKey))}
            >
                {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
