import { createAsyncThunk, createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import type { CreateNoteInput, Note, NotesQuery, UpdateNoteInput } from '../../types';
import { ApiError, notesApi } from '../../api/notesApi';
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
    saving: false
}

// local storage 
const LS_NOTES_KEY = 'app-notes-list';

function loadNotesFromStorage(): Note[] | null {
    try {
        const raw = localStorage.getItem(LS_NOTES_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as Note[];
        return null;
    } catch {
        return null;
    }
}

function saveNotesToStorage(notes: Note[]): void {
    try {
        localStorage.setItem(LS_NOTES_KEY, JSON.stringify(notes));
    } catch {
        console.error('Failed to save notes to localStorage');
    }
}

function toMessage(err: unknown): string {
    if (err instanceof ApiError) return err.message;
    if (err instanceof Error) return err.message;
    return 'Something went wrong.';
}

export const fetchNotes = createAsyncThunk('notes/fetch', async (query: NotesQuery, { rejectWithValue }) => {
    const cached = loadNotesFromStorage();
    if (cached) {
        return {
            items: cached,
            total: cached.length,
            page: query.page ?? 1,
            pageSize: query.pageSize ?? cached.length
        };
    }
    try {
        const result = await notesApi.list(query);
        saveNotesToStorage(result.items);
        return result;
    } catch (err) {
        return rejectWithValue(toMessage(err));
    }
});

export const createNote = createAsyncThunk(
    'notes/create',
    async (input: CreateNoteInput, { dispatch, getState, rejectWithValue }) => {
        const now = new Date().toISOString();
        const tempId = `temp-${nanoid()}`;
        const localId = String(Date.now());
        const optimistic: Note = { id: tempId, ...input, createdAt: now, updatedAt: now };
        dispatch(noteInserted(optimistic));
        dispatch(selectNote(tempId));
        try {
            await notesApi.create(input);
            const merged: Note = { ...optimistic, id: localId };
            dispatch(noteReplaced({ tempId, note: merged }));
            dispatch(selectNote(localId));
            
            const updatedItems = (getState() as RootState).notes.items.map((n) =>
                n.id === tempId ? merged : n
            );
            saveNotesToStorage(updatedItems);
            return merged;
        } catch (err) {
            dispatch(noteRemoved(tempId));
            const revertedItems = (getState() as RootState).notes.items.filter((n) => n.id !== tempId);
            saveNotesToStorage(revertedItems);
            return rejectWithValue(toMessage(err));
        }
    }
);

export const updateNote = createAsyncThunk(
    'notes/update',
    async ({ id, input }: { id: string; input: UpdateNoteInput }, { getState, dispatch, rejectWithValue }) => {
        const previous = (getState() as RootState).notes.items.find((n) => n.id === id);
        dispatch(notePatched({ id, input }));
        
        const patchedItems = (getState() as RootState).notes.items;
        saveNotesToStorage(patchedItems);
        try {
            await notesApi.update(id, input);
            return { id };
        } catch (err) {
            if (previous) {
                dispatch(noteReplaced({ tempId: id, note: previous }));
                // Revert localStorage to match rolled-back state
                const revertedItems = (getState() as RootState).notes.items;
                saveNotesToStorage(revertedItems);
            }
            return rejectWithValue(toMessage(err));
        }
    }
);

export const deleteNote = createAsyncThunk(
    'notes/delete',
    async (id: string, { getState, dispatch, rejectWithValue }) => {
        const state = (getState() as RootState).notes;
        const previous = state.items.find((n) => n.id === id);
        const previousIndex = state.items.findIndex((n) => n.id === id);
        dispatch(noteRemoved(id));
        if (state.selectedId === id) dispatch(selectNote(null));
        
        const updatedItems = (getState() as RootState).notes.items;
        saveNotesToStorage(updatedItems);
        try {
            await notesApi.remove(id);
            return id;
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                return id;
            }
            if (previous) {
                dispatch(noteRestored({ note: previous, index: previousIndex }));
                
                const restoredItems = (getState() as RootState).notes.items;
                saveNotesToStorage(restoredItems);
            }
            return rejectWithValue(toMessage(err));
        }
    }
);

const notesSlice = createSlice({
    name: 'notes',
    initialState,
    reducers: {
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
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotes.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchNotes.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload.items;
                state.total = action.payload.total;
            })
            .addCase(fetchNotes.rejected, (state, action) => {
                state.status = 'failed';
                state.error = (action.payload as string) ?? 'Failed to load notes.';
            })
            .addCase(createNote.pending, (state) => {
                state.saving = true;
            })
            .addCase(createNote.fulfilled, (state) => {
                state.saving = false;
            })
            .addCase(createNote.rejected, (state, action) => {
                state.saving = false;
                state.error = (action.payload as string) ?? 'Failed to create note.';
            })
            .addCase(updateNote.pending, (state) => {
                state.saving = true;
            })
            .addCase(updateNote.fulfilled, (state) => {
                state.saving = false;
            })
            .addCase(updateNote.rejected, (state, action) => {
                state.saving = false;
                state.error = (action.payload as string) ?? 'Failed to save note.';
            })
            .addCase(deleteNote.rejected, (state, action) => {
                state.error = (action.payload as string) ?? 'Failed to delete note.';
            });
    }
});

export const selectFilteredNotes = (state: RootState): Note[] => {
    const { search, tag, sort } = state.filters;
    let notes = state.notes.items;

    if (search) {
        const searchQuery = search.toLowerCase();
        notes = notes.filter(
            (item) => item.title.toLowerCase().includes(searchQuery) || item.content.toLowerCase().includes(searchQuery)
        );
    }

    if (tag) {
        notes = notes.filter((item) => item.tags.includes(tag));
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
    selectNote,
    noteInserted,
    noteReplaced,
    notePatched,
    noteRemoved,
    noteRestored,
    clearError
} = notesSlice.actions;

export const selectNotes = (state: RootState) => state.notes.items;
export const selectNotesStatus = (state: RootState) => state.notes.status;
export const selectNotesError = (state: RootState) => state.notes.error;
export const selectSelectedId = (state: RootState) => state.notes.selectedId;
export const selectSaving = (state: RootState) => state.notes.saving;
export const selectSelectedNote = (state: RootState) => state.notes.items.find((n) => n.id === state.notes.selectedId) ?? null;

export default notesSlice.reducer;