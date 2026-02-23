import { useBookmarkStore } from '@/lib/store'
import { BookmarkCard } from './BookmarkCard'

export function BookmarkList() {
  const { getFilteredBookmarks, filter } = useBookmarkStore()
  const bookmarks = getFilteredBookmarks()

  if (bookmarks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">📑</div>
          <h3 className="text-lg font-medium text-discord-text mb-2">
            {filter === 'all' ? 'No bookmarks yet' : `No ${filter} bookmarks`}
          </h3>
          <p className="text-discord-muted text-sm max-w-sm">
            {filter === 'all' 
              ? 'Press Ctrl+N or click the Add button to save your first Discord conversation.'
              : `You don't have any bookmarks in this category.`
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid gap-3 max-w-4xl mx-auto w-full pr-2">
        {bookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} />
        ))}
      </div>
    </div>
  )
}
