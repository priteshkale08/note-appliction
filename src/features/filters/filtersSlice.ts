import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SortKey } from '../../types';

export interface FiltersState {
    search: string;
    tag: string | null;
    sort: SortKey;
}

const initialState: FiltersState = {
    search: '',
    tag: null,
    sort: 'updatedAt'
};

const filtersSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {
        setSearch(state, action: PayloadAction<string>) {
            state.search = action.payload;
        },
        setTag(state, action: PayloadAction<string | null>) {
            state.tag = action.payload;
        },
        setSort(state, action: PayloadAction<SortKey>) {
            state.sort = action.payload;
        },
        clearFilters(state) {
            state.search = '';
            state.tag = null;
            state.sort = 'updatedAt';
        }
    }
});

export const { setSearch, setTag, setSort, clearFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
