import { useEffect } from 'react'
import { useBookmarkStore } from '@/lib/store'
import { BookmarkList } from '@/features/bookmarks/BookmarkList'
import { QuickAddModal } from '@/features/bookmarks/QuickAddModal'
import { Header } from '@/components/Header'

function App() {
  const { 
    isQuickAddOpen, 
    setQuickAddOpen, 
    loadBookmarks,
    setSelectedBookmark 
  } = useBookmarkStore()

  useEffect(() => {
    loadBookmarks()

    const unsubQuickAdd = window.electronAPI.onOpenQuickAdd(() => {
      setQuickAddOpen(true)
    })

    const unsubShowBookmark = window.electronAPI.onShowBookmark((id) => {
      setSelectedBookmark(id)
    })

    const unsubReminderFired = window.electronAPI.onReminderFired(({ bookmark }) => {
      loadBookmarks()
      setSelectedBookmark(bookmark.id)
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        setQuickAddOpen(true)
      }
      if (e.key === 'Escape' && isQuickAddOpen) {
        setQuickAddOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      unsubQuickAdd()
      unsubShowBookmark()
      unsubReminderFired()
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [loadBookmarks, setQuickAddOpen, setSelectedBookmark, isQuickAddOpen])

  return (
    <div className="flex flex-col h-screen min-h-0 bg-discord-darkest">
      <Header onQuickAdd={() => setQuickAddOpen(true)} />
      <main className="flex-1 min-h-0 overflow-hidden">
        <BookmarkList />
      </main>
      <QuickAddModal 
        isOpen={isQuickAddOpen} 
        onClose={() => setQuickAddOpen(false)} 
      />
    </div>
  )
}

export default App
