import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export interface Bookmark {
  id: string
  rawUrl: string
  guildId: string | null
  channelId: string | null
  messageId: string | null
  note: string
  status: 'active' | 'done' | 'archived'
  priority: 'urgent' | 'follow-up' | 'read-later' | 'none'
  createdAt: string
  updatedAt: string
  reminderId?: string
  dueAt?: string
  reminderState?: 'scheduled' | 'fired' | 'snoozed' | 'done'
}

export interface Reminder {
  id: string
  bookmarkId: string
  dueAt: string
  state: 'scheduled' | 'fired' | 'snoozed' | 'done'
  lastNotifiedAt: string | null
}

const electronAPI = {
  bookmark: {
    create: (bookmark: Omit<Bookmark, 'reminderId' | 'dueAt' | 'reminderState'>) => 
      ipcRenderer.invoke('bookmark:create', bookmark),
    getAll: () => ipcRenderer.invoke('bookmark:getAll') as Promise<Bookmark[]>,
    update: (bookmark: Partial<Bookmark> & { id: string }) => 
      ipcRenderer.invoke('bookmark:update', bookmark),
    delete: (id: string) => ipcRenderer.invoke('bookmark:delete', id)
  },
  reminder: {
    create: (reminder: Reminder) => ipcRenderer.invoke('reminder:create', reminder),
    update: (reminder: Partial<Reminder> & { id: string }) => 
      ipcRenderer.invoke('reminder:update', reminder),
    snooze: (id: string, newDueAt: string) => 
      ipcRenderer.invoke('reminder:snooze', { id, newDueAt })
  },
  openDiscordLink: (url: string) => ipcRenderer.invoke('open-discord-link', url),
  
  onOpenQuickAdd: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('open-quick-add', handler)
    return () => ipcRenderer.removeListener('open-quick-add', handler)
  },
  onShowBookmark: (callback: (id: string) => void) => {
    const handler = (_event: IpcRendererEvent, id: string) => callback(id)
    ipcRenderer.on('show-bookmark', handler)
    return () => ipcRenderer.removeListener('show-bookmark', handler)
  },
  onReminderFired: (callback: (data: { bookmark: Bookmark; reminder: Reminder }) => void) => {
    const handler = (_event: IpcRendererEvent, data: { bookmark: Bookmark; reminder: Reminder }) => callback(data)
    ipcRenderer.on('reminder-fired', handler)
    return () => ipcRenderer.removeListener('reminder-fired', handler)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
}
