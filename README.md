# Note Application

A full-featured, offline-capable note-taking app built with **React 19**, **TypeScript**, **Redux Toolkit**, **Tailwind CSS v4**, and **Vite**. It supports Markdown editing, tag-based filtering, real-time search, auto-save, dark/light mode, and optimistic UI updates backed by the [DummyJSON](https://dummyjson.com) REST API.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture Overview](#architecture-overview)
- [State Management](#state-management)
- [API Layer](#api-layer)
- [Components](#components)
- [Custom Hooks](#custom-hooks)
- [Utilities](#utilities)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Offline Support](#offline-support)
- [Optimistic UI](#optimistic-ui)
- [Dark / Light Mode](#dark--light-mode)
- [Responsive Layout](#responsive-layout)
- [Available Scripts](#available-scripts)

---

## Features

| Feature | Description |
|---|---|
| **Create notes** | Add a new note instantly via the header button or `N` key shortcut |
| **Edit notes** | Rich text editor with title, body, completion checkbox, and tags |
| **Markdown preview** | Toggle between raw editing and rendered Markdown at any time |
| **Auto-save** | Changes are automatically saved after a 600 ms debounce — no save button needed |
| **Delete notes** | Permanently remove a note with a confirmation dialog |
| **Tagging** | Attach multiple tags to a note; pick from a preset list or type custom ones |
| **Tag filter** | Sidebar panel to filter the note list by a single tag |
| **Search** | Real-time search across note titles and content |
| **Sort** | Sort notes by last updated, created date, title, or completion status |
| **Dark / Light mode** | Persisted in `localStorage`; defaults to the OS preference |
| **Offline banner** | A yellow banner appears when the browser goes offline; notes are reloaded automatically when connectivity is restored |
| **Optimistic updates** | Create / update / delete actions reflect in the UI instantly, with automatic rollback on API failure |
| **LocalStorage cache** | Notes are cached locally so the app works even before the API responds |
| **Error toasts** | A dismissible error banner appears at the bottom of the screen for any API failure |
| **Keyboard shortcuts** | `/` focuses the search bar; `N` opens a new note |
| **Responsive** | Three-column layout on desktop, two-column on tablet, single-panel (with back navigation) on mobile |

---

## Tech Stack

| Layer | Library / Tool | Version |
|---|---|---|
| UI framework | React | ^19.2 |
| Language | TypeScript | ~6.0 |
| State management | Redux Toolkit + React-Redux | ^2.12 / ^9.3 |
| Styling | Tailwind CSS v4 | ^4.3 |
| Icons | Lucide React | ^1.18 |
| Build tool | Vite | ^8.0 |
| Linting | ESLint + typescript-eslint | ^10 / ^8 |

---

## Project Structure

```
note-appliction/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/
│   │   └── notesApi.ts          # HTTP client + DummyJSON adapter
│   ├── app/
│   │   ├── hooks.ts             # Typed useAppDispatch / useAppSelector
│   │   └── store.ts             # Redux store configuration
│   ├── components/
│   │   ├── ConfirmDialog.tsx    # Reusable confirmation modal
│   │   ├── NoteEditor.tsx       # Full note editor panel
│   │   ├── NoteList.tsx         # Scrollable, filtered note list
│   │   ├── NoteListItem.tsx     # Single note card in the list
│   │   ├── TagFilter.tsx        # Sidebar tag filter panel
│   │   ├── TagInput.tsx         # Tag add/remove control inside the editor
│   │   └── Toolbar.tsx          # Search bar + sort dropdown
│   ├── features/
│   │   ├── filters/
│   │   │   └── filtersSlice.ts  # Redux slice for search / tag / sort state
│   │   └── notes/
│   │       └── notesSlice.ts    # Redux slice + async thunks for notes CRUD
│   ├── hooks/
│   │   ├── useDebounce.ts       # Generic debounce hook
│   │   └── useOnlineStatus.ts   # Browser online/offline hook
│   ├── utils/
│   │   ├── date.ts              # Date formatting helpers
│   │   └── markdown.ts          # Dependency-free Markdown → HTML renderer
│   ├── types.ts                 # Shared TypeScript interfaces
│   ├── App.tsx                  # Root component (layout + global effects)
│   ├── App.css                  # Global component-level styles
│   ├── index.css                # Tailwind base + CSS custom properties
│   └── main.tsx                 # React DOM entry point
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── eslint.config.js
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (or pnpm / yarn)

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd note-appliction

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173` by default.

---

## Environment Variables

Create a `.env` file in the project root to override the default API base URL:

```env
VITE_API_URL=https://dummyjson.com
```

If `VITE_API_URL` is not set, the app defaults to `https://dummyjson.com`. Any trailing slash is stripped automatically.

---

## Architecture Overview

```
Browser
  │
  ├── App.tsx (root layout, global keyboard shortcuts, online/offline reload)
  │
  ├── Redux Store
  │   ├── notes slice   ← async thunks: fetchNotes, createNote, updateNote, deleteNote
  │   └── filters slice ← search, tag, sort
  │
  ├── Components (read from store via selectors, dispatch actions)
  │   ├── Toolbar      → dispatches setSearch, setSort
  │   ├── TagFilter    → dispatches setTag
  │   ├── NoteList     → reads selectFilteredNotes (derived selector)
  │   └── NoteEditor   → dispatches updateNote, deleteNote
  │
  ├── API Layer (notesApi.ts)
  │   └── Wraps fetch() → maps DummyJSON /todos to Note shape
  │
  └── LocalStorage Cache
      └── app-notes-list key — used as a first-load cache in fetchNotes
```

---

## State Management

### `notesSlice` (`src/features/notes/notesSlice.ts`)

Manages the core notes data.

**State shape:**

```typescript
interface NoteState {
  items: Note[];       // All loaded notes
  total: number;       // Total count (for pagination metadata)
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  selectedId: string | null; // Currently open note
  saving: boolean;     // True while a create/update is in-flight
}
```

**Async thunks:**

| Thunk | Description |
|---|---|
| `fetchNotes(query)` | Loads notes; uses localStorage cache first, then falls back to the API |
| `createNote(input)` | Optimistically inserts a temp note, then replaces it with the real API response |
| `updateNote({ id, input })` | Optimistically patches the note locally, syncs to API, rolls back on failure |
| `deleteNote(id)` | Optimistically removes the note, rolls back (restoring original index) on failure |

**Selectors:**

| Selector | Returns |
|---|---|
| `selectFilteredNotes` | Notes filtered by search + tag, sorted by the active sort key |
| `selectSelectedNote` | The currently open `Note` object |
| `selectSaving` | Boolean — whether a save is in-flight |
| `selectNotesError` | Current error message or `null` |

---

### `filtersSlice` (`src/features/filters/filtersSlice.ts`)

Manages search, tag selection, and sort order.

**State shape:**

```typescript
interface FiltersState {
  search: string;
  tag: string | null;
  sort: 'createdAt' | 'updatedAt' | 'title' | 'completed';
}
```

**Actions:** `setSearch`, `setTag`, `setSort`, `clearFilters`

---

## API Layer

**File:** `src/api/notesApi.ts`

The app uses the free [DummyJSON](https://dummyjson.com/todos) `/todos` endpoint. An adapter function (`mapTodo`) converts the DummyJSON shape into the internal `Note` type.

| Method | Endpoint | Notes |
|---|---|---|
| `list(query)` | `GET /todos?limit=N&skip=N` | Paginated fetch |
| `get(id)` | `GET /todos/:id` | Single note fetch |
| `create(input)` | `POST /todos/add` | Creates a todo |
| `update(id, input)` | `PUT /todos/:id` | Updates title + completed |
| `remove(id)` | `DELETE /todos/:id` | Deletes a todo |

**Error handling:** All network failures throw a typed `ApiError` with `status`, `message`, `code`, and `details`. The thunks catch these and call `rejectWithValue` so Redux can surface the message in the UI.

---

## Components

### `App.tsx`
Root layout component. Handles:
- Dark/light mode state (persisted in `localStorage`)
- Global keyboard shortcuts (`/` → focus search, `N` → new note)
- Fetching notes on mount and on reconnect
- Rendering the three-panel grid (tag filter sidebar | note list | note editor)

### `NoteEditor`
The right-side editing panel. Features:
- Controlled form for `title`, `content`, `completed`, and `tags`
- **Auto-save** via `useDebounce` (600 ms delay) — dispatches `updateNote` only when the form actually changes
- **Markdown preview / edit toggle** — switches between a `<textarea>` and rendered HTML
- **Completion checkbox** — marks a note as done
- **Delete** — opens a `ConfirmDialog` before dispatching `deleteNote`
- Shows `Creating…`, `Saving…`, `Unsaved…`, or `Saved` status label

### `NoteList`
The center panel. Reads `selectFilteredNotes` and renders a `NoteListItem` for each result. Shows a loading skeleton, an empty state, or an error retry button as appropriate.

### `NoteListItem`
A single row in the note list. Displays title, content preview, tags, and relative timestamp. Clicking it dispatches `selectNote`.

### `Toolbar`
Contains the search input (wired to `setSearch`) and a sort dropdown (wired to `setSort`). The search input ref is forwarded from `App` so the `/` keyboard shortcut can programmatically focus it.

### `TagFilter`
Left sidebar. Lists all tags defined in `HARDCODED_TAGS` plus any tags present on existing notes. Clicking a tag dispatches `setTag`; clicking again deselects it.

### `TagInput`
Inside the `NoteEditor`. Allows adding tags by typing and pressing Enter/comma, or clicking `×` to remove them.

### `ConfirmDialog`
A simple modal overlay used before destructive actions (note deletion). Accepts `title`, `message`, `onConfirm`, and `onCancel` props.

---

## Custom Hooks

### `useDebounce<T>(value, delay)`
**File:** `src/hooks/useDebounce.ts`

Returns a debounced copy of `value` that only updates after `delay` milliseconds of inactivity. Used in `NoteEditor` to batch auto-save calls.

```typescript
const debouncedForm = useDebounce(form, 600);
```

### `useOnlineStatus()`
**File:** `src/hooks/useOnlineStatus.ts`

Returns a boolean (`true` = online) that updates in real time by listening to the browser's `online` and `offline` window events. Used in `App` to:
- Show the offline warning banner in the header
- Re-fetch notes automatically when connectivity is restored

---

## Utilities

### `renderMarkdown(markdown: string): string`
**File:** `src/utils/markdown.ts`

A dependency-free Markdown → HTML renderer. HTML is escaped **before** any formatting is applied, making it XSS-safe.

Supported syntax:
- Headings (`#` – `######`)
- Bold (`**text**`)
- Italic (`*text*`)
- Inline code (`` `code` ``)
- Fenced code blocks (` ``` `)
- Links (`[label](https://...)`)
- Unordered lists (`-` or `*`)
- Ordered lists (`1.`)
- Paragraphs and line breaks

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `/` | Focus the search input (works when not already typing) |
| `N` | Create a new untitled note (works when not already typing) |

---

## Offline Support

Notes are cached in `localStorage` under the key `app-notes-list`.

1. **First load** — `fetchNotes` checks localStorage first. If data exists, it is returned immediately without hitting the network.
2. **API success** — the API response overwrites the localStorage cache.
3. **Create / update / delete** — each thunk updates the cache optimistically and keeps it in sync with rollbacks.
4. **Reconnect** — `useOnlineStatus` triggers a fresh `fetchNotes` dispatch whenever the browser comes back online, ensuring the cache is refreshed.

---

## Optimistic UI

All write operations (create, update, delete) follow the same pattern:

1. **Dispatch a local action immediately** — the UI updates before the API responds.
2. **Call the API in the background.**
3. **On success** — replace or confirm the optimistic state.
4. **On failure** — dispatch a rollback action to revert the UI, update localStorage accordingly, and surface the error message.

This means every action feels instantaneous for the user while remaining consistent with server state.

---

## Dark / Light Mode

- Toggled by the sun/moon button in the header.
- The active theme is stored in `localStorage` under the key `theme` (`"dark"` or `"light"`).
- On first visit, the theme defaults to the OS preference via `window.matchMedia('(prefers-color-scheme: dark)')`.
- The `dark` class is applied to the root `<div>` and Tailwind's CSS custom properties handle all color switching.

---

## Responsive Layout

| Breakpoint | Layout |
|---|---|
| Mobile (`< md`) | Single panel — list **or** editor (back button returns to list) |
| Tablet (`md`) | Two columns — note list + note editor |
| Desktop (`lg+`) | Three columns — tag filter sidebar + note list + note editor |

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite development server with HMR at `http://localhost:5173` |
| `npm run build` | Type-check with `tsc` then produce an optimized production bundle in `dist/` |
