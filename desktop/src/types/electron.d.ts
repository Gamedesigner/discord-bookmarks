import type { Bookmark, Reminder } from '@/lib/types'

export interface ElectronAPI {
  bookmark: {
    create: (bookmark: Omit<Bookmark, 'reminderId' | 'dueAt' | 'reminderState'>) => Promise<Bookmark>
    getAll: () => Promise<Bookmark[]>
    update: (bookmark: Partial<Bookmark> & { id: string }) => Promise<Bookmark>
    delete: (id: string) => Promise<{ success: boolean }>
  }
  reminder: {
    create: (reminder: Reminder) => Promise<Reminder>
    update: (reminder: Partial<Reminder> & { id: string }) => Promise<Reminder>
    snooze: (id: string, newDueAt: string) => Promise<Reminder>
  }
  openDiscordLink: (url: string) => Promise<void>
  onOpenQuickAdd: (callback: () => void) => () => void
  onShowBookmark: (callback: (id: string) => void) => () => void
  onReminderFired: (callback: (data: { bookmark: Bookmark; reminder: Reminder }) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
