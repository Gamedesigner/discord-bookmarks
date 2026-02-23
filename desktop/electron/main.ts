import { app, BrowserWindow, ipcMain, Notification, shell, globalShortcut, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { initDatabase, getDatabase } from './database'
import { ReminderScheduler } from './reminderScheduler'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let reminderScheduler: ReminderScheduler | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const IS_DEV = !!VITE_DEV_SERVER_URL

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function toDiscordDeepLink(url: string): string | null {
  const channelMatch = url.match(
    /^https?:\/\/(?:www\.)?discord(?:app)?\.com\/channels\/([^/]+)\/([^/]+)(?:\/([^/?#]+))?/i
  )

  if (channelMatch) {
    const guildId = channelMatch[1]
    const channelId = channelMatch[2]
    const messageId = channelMatch[3]
    return messageId
      ? `discord://-/channels/${guildId}/${channelId}/${messageId}`
      : `discord://-/channels/${guildId}/${channelId}`
  }

  return null
}

function isDiscordRunning(): boolean {
  if (process.platform !== 'win32') {
    return false
  }

  try {
    const output = execSync('tasklist /FO CSV /NH', { encoding: 'utf-8' }).toLowerCase()
    return output.includes('"discord.exe"') || output.includes('"discordptb.exe"') || output.includes('"discordcanary.exe"')
  } catch {
    return false
  }
}

async function openDiscordLink(url: string): Promise<void> {
  const deepLink = toDiscordDeepLink(url)

  if (deepLink && isDiscordRunning()) {
    try {
      await shell.openExternal(deepLink)
      return
    } catch {
      // Fall through to original URL if deep link fails.
    }
  }

  await shell.openExternal(url)
}

async function loadRenderer(window: BrowserWindow): Promise<void> {
  if (!IS_DEV) {
    await window.loadFile(path.join(__dirname, '../dist/index.html'))
    return
  }

  const devUrl = VITE_DEV_SERVER_URL as string
  let attempt = 0
  const maxAttempts = 20

  while (attempt < maxAttempts) {
    attempt += 1
    try {
      await window.loadURL(devUrl)
      return
    } catch {
      await sleep(300)
    }
  }

  throw new Error(`Failed to load renderer from ${devUrl}`)
}

function createWindow() {
  const preloadPath = path.join(app.getAppPath(), 'electron', 'preload.cjs')

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#202225',
    titleBarStyle: 'hiddenInset',
    show: false
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.on('did-fail-load', (_event, code, description, validatedURL) => {
    console.error('Renderer failed to load:', { code, description, validatedURL })
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process exited:', details.reason)
  })

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2) {
      console.error('Renderer console:', message)
    }
  })

  loadRenderer(mainWindow).catch((error) => {
    console.error('Unable to load renderer:', error)
  })

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow?.show() },
    { label: 'Quick Add', click: () => {
      mainWindow?.show()
      mainWindow?.webContents.send('open-quick-add')
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => {
      app.isQuitting = true
      app.quit()
    }}
  ])
  
  tray.setToolTip('Discord Bookmark Companion')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => mainWindow?.show())
}

function registerGlobalShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+B', () => {
    mainWindow?.show()
    mainWindow?.webContents.send('open-quick-add')
  })
}

function setupIpcHandlers() {
  const db = getDatabase()

  ipcMain.handle('bookmark:create', async (_event, bookmark) => {
    const stmt = db.prepare(`
      INSERT INTO bookmarks (id, rawUrl, guildId, channelId, messageId, note, status, priority, createdAt, updatedAt)
      VALUES (@id, @rawUrl, @guildId, @channelId, @messageId, @note, @status, @priority, @createdAt, @updatedAt)
    `)
    stmt.run(bookmark)
    return bookmark
  })

  ipcMain.handle('bookmark:getAll', async () => {
    const stmt = db.prepare(`
      SELECT b.*, r.id as reminderId, r.dueAt, r.state as reminderState
      FROM bookmarks b
      LEFT JOIN reminders r ON r.id = (
        SELECT r2.id
        FROM reminders r2
        WHERE r2.bookmarkId = b.id
        ORDER BY
          CASE r2.state
            WHEN 'scheduled' THEN 0
            WHEN 'snoozed' THEN 1
            WHEN 'fired' THEN 2
            ELSE 3
          END,
          datetime(r2.dueAt) DESC
        LIMIT 1
      )
      ORDER BY b.createdAt DESC
    `)
    return stmt.all()
  })

  ipcMain.handle('bookmark:update', async (_event, bookmark) => {
    const existing = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(bookmark.id) as
      | {
          id: string
          rawUrl: string
          guildId: string | null
          channelId: string | null
          messageId: string | null
          note: string
          status: string
          priority: string
          createdAt: string
          updatedAt: string
        }
      | undefined

    if (!existing) {
      throw new Error(`Bookmark not found: ${bookmark.id}`)
    }

    const mergedBookmark = {
      ...existing,
      ...bookmark,
      updatedAt: bookmark.updatedAt ?? new Date().toISOString()
    }

    const stmt = db.prepare(`
      UPDATE bookmarks 
      SET rawUrl = @rawUrl, guildId = @guildId, channelId = @channelId, messageId = @messageId,
          note = @note, status = @status, priority = @priority, updatedAt = @updatedAt
      WHERE id = @id
    `)
    stmt.run(mergedBookmark)
    return mergedBookmark
  })

  ipcMain.handle('bookmark:delete', async (_event, id: string) => {
    db.prepare('DELETE FROM reminders WHERE bookmarkId = ?').run(id)
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('reminder:create', async (_event, reminder) => {
    const stmt = db.prepare(`
      INSERT INTO reminders (id, bookmarkId, dueAt, state, lastNotifiedAt)
      VALUES (@id, @bookmarkId, @dueAt, @state, @lastNotifiedAt)
    `)
    stmt.run(reminder)
    reminderScheduler?.scheduleReminder(reminder)
    return reminder
  })

  ipcMain.handle('reminder:update', async (_event, reminder) => {
    const stmt = db.prepare(`
      UPDATE reminders SET dueAt = @dueAt, state = @state, lastNotifiedAt = @lastNotifiedAt
      WHERE id = @id
    `)
    stmt.run(reminder)
    reminderScheduler?.rescheduleReminder(reminder)
    return reminder
  })

  ipcMain.handle('reminder:snooze', async (_event, { id, newDueAt }) => {
    const stmt = db.prepare(`
      UPDATE reminders SET dueAt = ?, state = 'scheduled'
      WHERE id = ?
    `)
    stmt.run(newDueAt, id)
    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id)
    reminderScheduler?.rescheduleReminder(reminder)
    return reminder
  })

  ipcMain.handle('open-discord-link', async (_event, url: string) => {
    await openDiscordLink(url)
  })
}

app.whenReady().then(() => {
  initDatabase()
  createWindow()
  createTray()
  registerGlobalShortcuts()
  setupIpcHandlers()
  
  reminderScheduler = new ReminderScheduler(
    getDatabase(),
    (bookmark, reminder) => {
      const notification = new Notification({
        title: 'Discord Bookmark Reminder',
        body: bookmark.note || 'Time to check your saved conversation!',
        urgency: 'normal'
      })
      
      notification.on('click', () => {
        mainWindow?.show()
        mainWindow?.webContents.send('show-bookmark', bookmark.id)
        void openDiscordLink(bookmark.rawUrl)
      })
      
      notification.show()
      mainWindow?.webContents.send('reminder-fired', { bookmark, reminder })
    }
  )
  reminderScheduler.start()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  reminderScheduler?.stop()
})

declare module 'electron' {
  interface App {
    isQuitting?: boolean
  }
}
