import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import { parseDiscordUrl, getUrlTypeLabel } from '@/lib/discordUrlParser'
import { REMINDER_PRESETS, PRIORITY_OPTIONS } from '@/lib/presets'
import { useBookmarkStore } from '@/lib/store'
import type { Priority, Bookmark, Reminder } from '@/lib/types'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [priority, setPriority] = useState<Priority>('none')
  const [selectedReminder, setSelectedReminder] = useState<string | null>(null)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')
  const [showCustomDateTime, setShowCustomDateTime] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const urlInputRef = useRef<HTMLInputElement>(null)
  const { loadBookmarks, editingBookmark, setEditingBookmark } = useBookmarkStore()

  const parsedUrl = url ? parseDiscordUrl(url) : null

  useEffect(() => {
    if (isOpen) {
      if (editingBookmark) {
        setUrl(editingBookmark.rawUrl)
        setNote(editingBookmark.note)
        setPriority(editingBookmark.priority)
        if (editingBookmark.dueAt) {
          const dueDate = new Date(editingBookmark.dueAt)
          setCustomDate(format(dueDate, 'yyyy-MM-dd'))
          setCustomTime(format(dueDate, 'HH:mm'))
          setShowCustomDateTime(true)
          setSelectedReminder('custom')
        }
      } else {
        resetForm()
      }
      setTimeout(() => urlInputRef.current?.focus(), 100)
    }
  }, [isOpen, editingBookmark])

  const resetForm = () => {
    setUrl('')
    setNote('')
    setPriority('none')
    setSelectedReminder(null)
    setCustomDate('')
    setCustomTime('')
    setShowCustomDateTime(false)
    setUrlError('')
  }

  const handleClose = () => {
    resetForm()
    setEditingBookmark(null)
    onClose()
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    setUrlError('')
    
    if (value && !parseDiscordUrl(value).isValid) {
      setUrlError('Please enter a valid Discord URL')
    }
  }

  const handleReminderSelect = (presetId: string) => {
    if (presetId === 'custom') {
      setShowCustomDateTime(true)
      setSelectedReminder('custom')
    } else {
      setShowCustomDateTime(false)
      setSelectedReminder(selectedReminder === presetId ? null : presetId)
    }
  }

  const getReminderDate = (): string | null => {
    if (!selectedReminder) return null
    
    if (selectedReminder === 'custom' && customDate && customTime) {
      return new Date(`${customDate}T${customTime}`).toISOString()
    }
    
    const preset = REMINDER_PRESETS.find((p) => p.id === selectedReminder)
    return preset ? preset.getDate().toISOString() : null
  }

  const handleSubmit = async () => {
    if (!url.trim()) {
      setUrlError('URL is required')
      return
    }

    if (!parsedUrl?.isValid) {
      setUrlError('Please enter a valid Discord URL')
      return
    }

    setIsSubmitting(true)

    try {
      const now = new Date().toISOString()
      const bookmarkId = editingBookmark?.id || uuidv4()
      
      const bookmark: Omit<Bookmark, 'reminderId' | 'dueAt' | 'reminderState'> = {
        id: bookmarkId,
        rawUrl: url.trim(),
        guildId: parsedUrl.guildId,
        channelId: parsedUrl.channelId,
        messageId: parsedUrl.messageId,
        note: note.trim(),
        status: editingBookmark?.status ?? 'active',
        priority,
        createdAt: editingBookmark?.createdAt || now,
        updatedAt: now
      }

      if (editingBookmark) {
        await window.electronAPI.bookmark.update(bookmark)
      } else {
        await window.electronAPI.bookmark.create(bookmark)
      }

      const reminderDate = getReminderDate()
      if (reminderDate) {
        if (editingBookmark?.reminderId) {
          await window.electronAPI.reminder.update({
            id: editingBookmark.reminderId,
            dueAt: reminderDate,
            state: 'scheduled',
            lastNotifiedAt: null
          })
        } else {
          const reminder: Reminder = {
            id: uuidv4(),
            bookmarkId,
            dueAt: reminderDate,
            state: 'scheduled',
            lastNotifiedAt: null
          }
          await window.electronAPI.reminder.create(reminder)
        }
      }

      await loadBookmarks()
      
      handleClose()
    } catch (error) {
      console.error('Failed to save bookmark:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div 
        className="bg-discord-darker rounded-lg w-full max-w-lg mx-4 shadow-xl"
        onKeyDown={handleKeyDown}
      >
        <div className="px-6 py-4 border-b border-discord-dark">
          <h2 className="text-lg font-semibold text-white">
            {editingBookmark ? 'Edit Bookmark' : 'Quick Add Bookmark'}
          </h2>
          <p className="text-sm text-discord-muted mt-1">
            Paste a Discord message or channel link
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-discord-text mb-1.5">
              Discord URL
            </label>
            <input
              ref={urlInputRef}
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://discord.com/channels/..."
              className={`input ${urlError ? 'border-discord-red' : ''}`}
            />
            {urlError && (
              <p className="text-discord-red text-sm mt-1">{urlError}</p>
            )}
            {parsedUrl?.isValid && (
              <p className="text-discord-green text-sm mt-1">
                {getUrlTypeLabel(parsedUrl.type)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-discord-text mb-1.5">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note to remember why you saved this..."
              rows={2}
              className="input resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-discord-text mb-2">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPriority(option.id)}
                  className={`chip chip-${option.id} ${
                    priority === option.id ? 'chip-selected' : ''
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-discord-text mb-2">
              Reminder
            </label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleReminderSelect(preset.id)}
                  className={`chip bg-discord-dark text-discord-text hover:bg-discord-darkest ${
                    selectedReminder === preset.id ? 'chip-selected' : ''
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleReminderSelect('custom')}
                className={`chip bg-discord-dark text-discord-text hover:bg-discord-darkest ${
                  selectedReminder === 'custom' ? 'chip-selected' : ''
                }`}
              >
                Custom...
              </button>
            </div>

            {showCustomDateTime && (
              <div className="flex gap-2 mt-3">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="input flex-1"
                />
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="input w-32"
                />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-discord-dark flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !url.trim()}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : editingBookmark ? 'Update' : 'Save'}
            <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-white bg-opacity-20 rounded">
              ⌘↵
            </kbd>
          </button>
        </div>
      </div>
    </div>
  )
}
