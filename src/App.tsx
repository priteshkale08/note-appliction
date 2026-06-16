import NoteList from './components/NoteList'
import NoteEditor from './components/NoteEditor'
import TagFilter from './components/TagFilter'

export default function App() {
    return (
        <div className="flex flex-col h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
            <header className="flex items-center gap-3 px-4 py-3 shrink-0 border-b">
                <h1 className="text-xl font-bold">Note Application</h1>
            </header>

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[220px_minmax(280px,1fr)_minmax(360px,1.6fr)]">
                <aside className="hidden lg:flex flex-col border-r overflow-y-auto p-3">
                    <TagFilter />
                </aside>

                <main className="flex flex-col border-r min-h-0">
                    <NoteList />
                </main>

                <section className="flex flex-col min-h-0 overflow-y-auto">
                    <NoteEditor />
                </section>
            </div>
        </div>
    )
}
