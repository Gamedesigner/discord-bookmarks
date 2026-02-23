import { create } from 'zustand'
import type { Bookmark } from './types'

type FilterType = 'all' | 'due' | 'urgent' | 'done'
type SortType = 'created' | 'due'

interface BookmarkState {
  bookmarks: Bookmark[]
  filter: FilterType
  sortBy: SortType
  searchQuery: string
  selectedBookmarkId: string | null
  isQuickAddOpen: boolean
  editingBookmark: Bookmark | null

  setBookmarks: (bookmarks: Bookmark[]) => void
  addBookmark: (bookmark: Bookmark) => void
  updateBookmark: (bookmark: Partial<Bookmark> & { id: string }) => void
  removeBookmark: (id: string) => void
  setFilter: (filter: FilterType) => void
  setSortBy: (sort: SortType) => void
  setSearchQuery: (query: string) => void
  setSelectedBookmark: (id: string | null) => void
  setQuickAddOpen: (open: boolean) => void
  setEditingBookmark: (bookmark: Bookmark | null) => void
  loadBookmarks: () => Promise<void>
  
  getFilteredBookmarks: () => Bookmark[]
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  filter: 'all',
  sortBy: 'created',
  searchQuery: '',
  selectedBookmarkId: null,
  isQuickAddOpen: false,
  editingBookmark: null,

  setBookmarks: (bookmarks) => set({ bookmarks }),
  
  addBookmark: (bookmark) => set((state) => ({ 
    bookmarks: [bookmark, ...state.bookmarks] 
  })),
  
  updateBookmark: (updated) => set((state) => ({
    bookmarks: state.bookmarks.map((b) => 
      b.id === updated.id ? { ...b, ...updated } : b
    )
  })),
  
  removeBookmark: (id) => set((state) => ({
    bookmarks: state.bookmarks.filter((b) => b.id !== id)
  })),
  
  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedBookmark: (selectedBookmarkId) => set({ selectedBookmarkId }),
  setQuickAddOpen: (isQuickAddOpen) => set({ isQuickAddOpen }),
  setEditingBookmark: (editingBookmark) => set({ editingBookmark }),
  
  loadBookmarks: async () => {
    const bookmarks = await window.electronAPI.bookmark.getAll()
    set({ bookmarks })
  },

  getFilteredBookmarks: () => {
    const { bookmarks, filter, searchQuery, sortBy } = get()
    
    let filtered = [...bookmarks]

    if (filter === 'due') {
      const now = new Date().toISOString()
      filtered = filtered.filter(
        (b) => b.status !== 'done' && b.dueAt && b.reminderState === 'scheduled' && b.dueAt <= now
      )
    } else if (filter === 'urgent') {
      filtered = filtered.filter((b) => b.status !== 'done' && b.priority === 'urgent')
    } else if (filter === 'done') {
      filtered = filtered.filter((b) => b.status === 'done')
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.note?.toLowerCase().includes(q) ||
          b.rawUrl.toLowerCase().includes(q)
      )
    }

    filtered.sort((a, b) => {
      if (filter === 'all' && a.status !== b.status) {
        return a.status === 'done' ? 1 : -1
      }

      if (sortBy === 'due') {
        if (!a.dueAt && !b.dueAt) return 0
        if (!a.dueAt) return 1
        if (!b.dueAt) return -1
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return filtered
  }
}))
