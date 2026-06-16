export interface Note {
    id: string;
    title: string;
    content: string;
    completed: boolean;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export type SortKey = 'createdAt' | 'updatedAt' | 'title' | 'completed';

export interface NotesQuery {
    search?: string;
    tag?: string;
    sort?: SortKey;
    page?: number;
    pageSize?: number;
}

export interface PaginatedNotes {
    items: Note[];
    total: number;
    page: number;
    pageSize: number;
}

export type CreateNoteInput = {
    title: string;
    content: string;
    completed: boolean;
    tags: string[];
};

export type UpdateNoteInput = Partial<CreateNoteInput>;
