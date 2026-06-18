import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import notesReducer from '../features/notes/notesSlice';
import filtersReducer from '../features/filters/filtersSlice';
import { notesSaga } from '../features/notes/notesSaga';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
    reducer: {
        notes: notesReducer,
        filters: filtersReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),
});

sagaMiddleware.run(notesSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
