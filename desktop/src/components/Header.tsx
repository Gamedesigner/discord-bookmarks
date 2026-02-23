import { useBookmarkStore } from '@/lib/store'

interface HeaderProps {
  onQuickAdd: () => void
}

export function Header({ onQuickAdd }: HeaderProps) {
  const { filter, setFilter, searchQuery, setSearchQuery } = useBookmarkStore()

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'due', label: 'Due' },
    { id: 'urgent', label: 'Urgent' },
    { id: 'done', label: 'Done' }
  ] as const

  return (
    <header className="bg-discord-darker border-b border-discord-dark px-4 py-3 flex items-center gap-4 app-drag-region">
      <h1 className="text-lg font-semibold text-white mr-4">Bookmarks</h1>
      
      <div className="flex gap-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              filter === f.id
                ? 'bg-discord-blurple text-white'
                : 'text-discord-muted hover:text-discord-text hover:bg-discord-dark'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 max-w-md ml-4">
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input text-sm py-1.5"
        />
      </div>

      <button
        onClick={onQuickAdd}
        className="btn btn-primary flex items-center gap-2"
      >
        <span className="text-lg leading-none">+</span>
        <span>Add</span>
        <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-white bg-opacity-20 rounded">
          Ctrl+N
        </kbd>
      </button>
    </header>
  )
}
