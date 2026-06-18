import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Note, UpdateNoteInput } from '../../types';
import type { RootState } from '../../app/store';

export const HARDCODED_TAGS = [
    'work',
    'personal',
    'ideas',
    'todo',
    'important',
    'project',
    'meeting',
    'learning'
] as const;

export type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface NoteState {
    items: Note[];
    total: number;
    status: Status;
    error: string | null;
    selectedId: string | null;
    saving: boolean;
}

const initialState: NoteState = {
    items: [],
    total: 0,
    status: 'idle',
    error: null,
    selectedId: null,
    saving: false,
};

const notesSlice = createSlice({
    name: 'notes',
    initialState,
    reducers: {
        fetchStarted(state) {
            state.status = 'loading';
            state.error = null;
        },
        fetchSucceeded(state, action: PayloadAction<{ items: Note[]; total: number }>) {
            state.status = 'succeeded';
            state.items = action.payload.items;
            state.total = action.payload.total;
        },
        fetchFailed(state, action: PayloadAction<string>) {
            state.status = 'failed';
            state.error = action.payload;
        },
        saveStarted(state) {
            state.saving = true;
        },
        saveEnded(state) {
            state.saving = false;
        },
        saveError(state, action: PayloadAction<string>) {
            state.saving = false;
            state.error = action.payload;
        },
        selectNote(state, action: PayloadAction<string | null>) {
            state.selectedId = action.payload;
        },
        noteInserted(state, action: PayloadAction<Note>) {
            state.items.unshift(action.payload);
            state.total += 1;
        },
        noteReplaced(state, action: PayloadAction<{ tempId: string; note: Note }>) {
            const idx = state.items.findIndex((n) => n.id === action.payload.tempId);
            if (idx !== -1) state.items[idx] = action.payload.note;
        },
        notePatched(state, action: PayloadAction<{ id: string; input: UpdateNoteInput }>) {
            const note = state.items.find((n) => n.id === action.payload.id);
            if (note) {
                Object.assign(note, action.payload.input);
                note.updatedAt = new Date().toISOString();
            }
        },
        noteRemoved(state, action: PayloadAction<string>) {
            state.items = state.items.filter((n) => n.id !== action.payload);
            state.total = Math.max(0, state.total - 1);
        },
        noteRestored(state, action: PayloadAction<{ note: Note; index: number }>) {
            const { note, index } = action.payload;
            state.items.splice(Math.max(0, index), 0, note);
            state.total += 1;
        },
        clearError(state) {
            state.error = null;
        },
    },
});

export const selectFilteredNotes = (state: RootState): Note[] => {
    const { search, tag, sort } = state.filters;
    let notes = state.notes.items;

    if (search) {
        const q = search.toLowerCase();
        notes = notes.filter(
            (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
        );
    }

    if (tag) {
        notes = notes.filter((n) => n.tags.includes(tag));
    }

    return [...notes].sort((a, b) => {
        if (sort === 'title') return a.title.localeCompare(b.title);
        if (sort === 'createdAt') return b.createdAt.localeCompare(a.createdAt);
        if (sort === 'updatedAt') return b.updatedAt.localeCompare(a.updatedAt);
        if (sort === 'completed') return (b.completed ? 1 : 0) - (a.completed ? 1 : 0);
        return 0;
    });
};

export const {
    fetchStarted,
    fetchSucceeded,
    fetchFailed,
    saveStarted,
    saveEnded,
    saveError,
    selectNote,
    noteInserted,
    noteReplaced,
    notePatched,
    noteRemoved,
    noteRestored,
    clearError,
} = notesSlice.actions;

export const selectNotes = (state: RootState) => state.notes.items;
export const selectNotesStatus = (state: RootState) => state.notes.status;
export const selectNotesError = (state: RootState) => state.notes.error;
export const selectSelectedId = (state: RootState) => state.notes.selectedId;
export const selectSaving = (state: RootState) => state.notes.saving;
export const selectSelectedNote = (state: RootState) =>
    state.notes.items.find((n) => n.id === state.notes.selectedId) ?? null;

export default notesSlice.reducer;
