import { useState } from 'react'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { useBookmarkStore } from '@/lib/store'
import { SNOOZE_PRESETS, PRIORITY_OPTIONS } from '@/lib/presets'
import { getUrlTypeLabel, parseDiscordUrl } from '@/lib/discordUrlParser'
import type { Bookmark } from '@/lib/types'

interface BookmarkCardProps {
  bookmark: Bookmark
}

export function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const [showSnooze, setShowSnooze] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { updateBookmark, removeBookmark, setEditingBookmark, setQuickAddOpen, loadBookmarks } = useBookmarkStore()

  const parsedUrl = parseDiscordUrl(bookmark.rawUrl)
  const priorityOption = PRIORITY_OPTIONS.find((p) => p.id === bookmark.priority)
  const isDue = bookmark.dueAt && isPast(new Date(bookmark.dueAt)) && bookmark.reminderState === 'scheduled'
  const isUrgent = bookmark.priority === 'urgent'

  const handleOpenLink = () => {
    window.electronAPI.openDiscordLink(bookmark.rawUrl)
  }

  const handleToggleDone = async () => {
    const newStatus = bookmark.status === 'done' ? 'active' : 'done'
    await window.electronAPI.bookmark.update({
      id: bookmark.id,
      status: newStatus,
      updatedAt: new Date().toISOString()
    })
    updateBookmark({ id: bookmark.id, status: newStatus })
  }

  const handleEdit = () => {
    setEditingBookmark(bookmark)
    setQuickAddOpen(true)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this bookmark?')) return
    setIsDeleting(true)
    try {
      await window.electronAPI.bookmark.delete(bookmark.id)
      removeBookmark(bookmark.id)
    } catch (error) {
      console.error('Failed to delete bookmark:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSnooze = async (presetId: string) => {
    const preset = SNOOZE_PRESETS.find((p) => p.id === presetId)
    if (!preset || !bookmark.reminderId) return

    await window.electronAPI.reminder.snooze(bookmark.reminderId, preset.getDate().toISOString())
    await loadBookmarks()
    setShowSnooze(false)
  }

  return (
    <div 
      className={`card group hover:border-discord-blurple transition-colors ${
        isUrgent ? 'border-discord-red' : ''
      } ${bookmark.status === 'done' ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggleDone}
          className={`mt-1 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            bookmark.status === 'done'
              ? 'bg-discord-green border-discord-green'
              : 'border-discord-muted hover:border-discord-blurple'
          }`}
        >
          {bookmark.status === 'done' && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {bookmark.priority !== 'none' && (
              <span className={`chip chip-${bookmark.priority} text-xs py-0.5`}>
                {priorityOption?.label}
              </span>
            )}
            <span className="text-xs text-discord-muted">
              {getUrlTypeLabel(parsedUrl.type)}
            </span>
            {isDue && (
              <span className="text-xs text-discord-text font-medium">
                Due!
              </span>
            )}
          </div>

          {bookmark.note && (
            <p className={`text-discord-text mb-2 ${bookmark.status === 'done' ? 'line-through' : ''}`}>
              {bookmark.note}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={handleOpenLink}
              className="text-discord-muted hover:text-discord-blurple truncate max-w-xs"
              title={bookmark.rawUrl}
            >
              {bookmark.rawUrl}
            </button>
            
            {bookmark.dueAt && (
              isDue ? (
                <span className="font-semibold text-discord-yellow">OVERDUE!</span>
              ) : (
                <span className="font-medium text-discord-blurple">
                  ⏰ {formatDistanceToNow(new Date(bookmark.dueAt), { addSuffix: true })}
                </span>
              )
            )}
            
            <span className="text-discord-muted">
              Added {format(new Date(bookmark.createdAt), 'MMM d')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {bookmark.reminderId && bookmark.reminderState !== 'done' && (
            <div className="relative">
              <button
                onClick={() => setShowSnooze(!showSnooze)}
                className="p-2 text-discord-text hover:text-white hover:bg-discord-dark rounded"
                title="Snooze"
              >
                ⏰
              </button>
              
              {showSnooze && (
                <div className="absolute right-0 top-full mt-1 bg-discord-darkest border border-discord-dark rounded-lg shadow-lg py-1 z-10 min-w-32">
                  {SNOOZE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSnooze(preset.id)}
                      className="w-full px-3 py-1.5 text-sm text-left text-discord-text hover:bg-discord-dark"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleOpenLink}
            className="p-2 text-discord-muted hover:text-discord-blurple hover:bg-discord-dark rounded"
            title="Open in Discord"
          >
            ↗
          </button>
          
          <button
            onClick={handleEdit}
            className="p-2 text-discord-muted hover:text-discord-text hover:bg-discord-dark rounded"
            title="Edit"
          >
            ✎
          </button>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-discord-muted hover:text-discord-red hover:bg-discord-dark rounded disabled:opacity-50"
            title="Delete"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  )
}
