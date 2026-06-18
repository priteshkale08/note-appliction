import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { createAction, nanoid } from '@reduxjs/toolkit';
import { ApiError, notesApi } from '../../api/notesApi';
import type { RootState } from '../../app/store';
import type { CreateNoteInput, Note, NotesQuery, PaginatedNotes, UpdateNoteInput } from '../../types';
import {
    fetchStarted,
    fetchSucceeded,
    fetchFailed,
    saveStarted,
    saveEnded,
    saveError,
    noteInserted,
    noteReplaced,
    noteRemoved,
    notePatched,
    noteRestored,
    selectNote as selectNoteAction,
} from './notesSlice';

// Request actions — dispatched by components
export const fetchNotesRequest = createAction<NotesQuery>('notes/fetchRequest');
export const createNoteRequest = createAction<CreateNoteInput>('notes/createRequest');
export const updateNoteRequest = createAction<{ id: string; input: UpdateNoteInput }>('notes/updateRequest');
export const deleteNoteRequest = createAction<string>('notes/deleteRequest');

// localStorage helpers
const LS_KEY = 'app-notes-list';

function loadFromStorage(): Note[] | null {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as Note[];
        return null;
    } catch {
        return null;
    }
}

function saveToStorage(notes: Note[]): void {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(notes));
    } catch {
        console.error('Failed to save notes to localStorage');
    }
}

function toMessage(err: unknown): string {
    if (err instanceof ApiError) return err.message;
    if (err instanceof Error) return err.message;
    return 'Something went wrong.';
}

// Saga: Fetch notes
function* fetchNotesSaga(action: ReturnType<typeof fetchNotesRequest>) {
    yield put(fetchStarted());

    const cached = loadFromStorage();
    if (cached) {
        yield put(fetchSucceeded({ items: cached, total: cached.length }));
        return;
    }

    try {
        const result = (yield call([notesApi, notesApi.list], action.payload)) as PaginatedNotes;
        saveToStorage(result.items);
        yield put(fetchSucceeded({ items: result.items, total: result.total }));
    } catch (err) {
        yield put(fetchFailed(toMessage(err)));
    }
}

// Saga: Create note
function* createNoteSaga(action: ReturnType<typeof createNoteRequest>) {
    const now = new Date().toISOString();
    const tempId = `temp-${nanoid()}`;
    const localId = String(Date.now());

    const optimistic: Note = { id: tempId, ...action.payload, createdAt: now, updatedAt: now };

    yield put(noteInserted(optimistic));
    yield put(selectNoteAction(tempId));
    yield put(saveStarted());

    try {
        yield call([notesApi, notesApi.create], action.payload);

        const merged: Note = { ...optimistic, id: localId };
        yield put(noteReplaced({ tempId, note: merged }));
        yield put(selectNoteAction(localId));
        yield put(saveEnded());

        const items = (yield select((s: RootState) => s.notes.items)) as Note[];
        saveToStorage(items.map((n) => (n.id === tempId ? merged : n)));
    } catch (err) {
        yield put(noteRemoved(tempId));
        yield put(saveError(toMessage(err)));

        const items = (yield select((s: RootState) => s.notes.items)) as Note[];
        saveToStorage(items.filter((n) => n.id !== tempId));
    }
}

// Saga: Update note
function* updateNoteSaga(action: ReturnType<typeof updateNoteRequest>) {
    const { id, input } = action.payload;

    const previous = (yield select(
        (s: RootState) => s.notes.items.find((n) => n.id === id)
    )) as Note | undefined;

    yield put(notePatched({ id, input }));
    yield put(saveStarted());

    const patchedItems = (yield select((s: RootState) => s.notes.items)) as Note[];
    saveToStorage(patchedItems);

    try {
        yield call([notesApi, notesApi.update], id, input);
        yield put(saveEnded());
    } catch (err) {
        if (previous) {
            yield put(noteReplaced({ tempId: id, note: previous }));
            const revertedItems = (yield select((s: RootState) => s.notes.items)) as Note[];
            saveToStorage(revertedItems);
        }
        yield put(saveError(toMessage(err)));
    }
}

// Saga: Delete note
function* deleteNoteSaga(action: ReturnType<typeof deleteNoteRequest>) {
    const id = action.payload;

    const notesState = (yield select((s: RootState) => s.notes)) as RootState['notes'];
    const previous = notesState.items.find((n) => n.id === id);
    const previousIndex = notesState.items.findIndex((n) => n.id === id);

    yield put(noteRemoved(id));
    if (notesState.selectedId === id) yield put(selectNoteAction(null));

    const updatedItems = (yield select((s: RootState) => s.notes.items)) as Note[];
    saveToStorage(updatedItems);

    try {
        yield call([notesApi, notesApi.remove], id);
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) return;

        if (previous) {
            yield put(noteRestored({ note: previous, index: previousIndex }));
            const restoredItems = (yield select((s: RootState) => s.notes.items)) as Note[];
            saveToStorage(restoredItems);
        }
        yield put(saveError(toMessage(err)));
    }
}

// Root saga — registers all watchers
export function* notesSaga() {
    yield takeLatest(fetchNotesRequest, fetchNotesSaga);
    yield takeEvery(createNoteRequest, createNoteSaga);
    yield takeLatest(updateNoteRequest, updateNoteSaga);
    yield takeEvery(deleteNoteRequest, deleteNoteSaga);
}
