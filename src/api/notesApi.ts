import type { CreateNoteInput, Note, NotesQuery, PaginatedNotes, UpdateNoteInput } from '../types';

/**
 * DummyJSON base URL. Override with VITE_API_URL at build/run time.
 */
export const API_BASE_URL =
    (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'https://dummyjson.com';

export interface ApiErrorShape {
    error: {
        message: string;
        code?: string;
        details?: unknown;
    };
}

export class ApiError extends Error {
    status: number;
    code?: string;
    details?: unknown;

    constructor(status: number, message: string, code?: string, details?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}${path}`, {
            headers: { 'Content-Type': 'application/json' },
            ...init
        });
    } catch {
        throw new ApiError(0, 'Network error — unable to reach the server.', 'NETWORK_ERROR');
    }

    if (res.status === 204) {
        return undefined as T;
    }

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
        const errBody = body as ApiErrorShape | null;
        throw new ApiError(
            res.status,
            errBody?.error?.message ?? `Request failed with status ${res.status}`,
            errBody?.error?.code,
            errBody?.error?.details
        );
    }

    return body as T;
}

interface DummyTodo {
    id: number;
    todo: string;
    completed: boolean;
    userId: number;
}

interface DummyListResponse {
    todos: DummyTodo[];
    total: number;
    skip: number;
    limit: number;
}

function mapTodo(todo: DummyTodo): Note {
    const now = new Date().toISOString();
    return {
        id: String(todo.id),
        title: todo.todo,
        content: '',
        completed: todo.completed,
        tags: [],
        createdAt: now,
        updatedAt: now
    };
}

export const notesApi = {
    list(query: NotesQuery = {}): Promise<PaginatedNotes> {
        const limit = query.pageSize ?? 10;
        const skip = ((query.page ?? 1) - 1) * limit;
        return request<DummyListResponse>(`/todos?limit=${limit}&skip=${skip}`).then((r) => ({
            items: r.todos.map(mapTodo),
            total: r.total,
            page: query.page ?? 1,
            pageSize: limit
        }));
    },

    get(id: string): Promise<Note> {
        return request<DummyTodo>(`/todos/${id}`).then(mapTodo);
    },

    create(input: CreateNoteInput): Promise<Note> {
        return request<DummyTodo>('/todos/add', {
            method: 'POST',
            body: JSON.stringify(
                {   
                    todo: input.title,
                    completed: input.completed ?? false,
                    userId: 1
                }
            )
        }).then(mapTodo);
    },

    update(id: string, input: UpdateNoteInput): Promise<Note> {
        return request<DummyTodo>(`/todos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(
                { 
                    todo: input.title,
                    completed: input.completed ?? false
                }
            )
        }).then(mapTodo);
    },

    remove(id: string): Promise<void> {
        return request<void>(`/todos/${id}`, { method: 'DELETE' });
    }
};
