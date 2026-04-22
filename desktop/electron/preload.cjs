const { contextBridge, ipcRenderer } = require('electron')

const electronAPI = {
  bookmark: {
    create: (bookmark) => ipcRenderer.invoke('bookmark:create', bookmark),
    getAll: () => ipcRenderer.invoke('bookmark:getAll'),
    update: (bookmark) => ipcRenderer.invoke('bookmark:update', bookmark),
    delete: (id) => ipcRenderer.invoke('bookmark:delete', id)
  },
  reminder: {
    create: (reminder) => ipcRenderer.invoke('reminder:create', reminder),
    update: (reminder) => ipcRenderer.invoke('reminder:update', reminder),
    snooze: (id, newDueAt) => ipcRenderer.invoke('reminder:snooze', { id, newDueAt })
  },
  openDiscordLink: (url) => ipcRenderer.invoke('open-discord-link', url),
  onOpenQuickAdd: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('open-quick-add', handler)
    return () => ipcRenderer.removeListener('open-quick-add', handler)
  },
  onShowBookmark: (callback) => {
    const handler = (_event, id) => callback(id)
    ipcRenderer.on('show-bookmark', handler)
    return () => ipcRenderer.removeListener('show-bookmark', handler)
  },
  onReminderFired: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('reminder-fired', handler)
    return () => ipcRenderer.removeListener('reminder-fired', handler)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
