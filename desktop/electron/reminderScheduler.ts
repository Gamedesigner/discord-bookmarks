import Database from 'better-sqlite3'

interface Bookmark {
  id: string
  rawUrl: string
  note: string
  status: string
  priority: string
}

interface Reminder {
  id: string
  bookmarkId: string
  dueAt: string
  state: string
}

type NotificationCallback = (bookmark: Bookmark, reminder: Reminder) => void

export class ReminderScheduler {
  private db: Database.Database
  private onNotify: NotificationCallback
  private intervalId: NodeJS.Timeout | null = null
  private scheduledTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private checkIntervalMs = 60000

  constructor(db: Database.Database, onNotify: NotificationCallback) {
    this.db = db
    this.onNotify = onNotify
  }

  start(): void {
    this.loadAndScheduleReminders()
    this.intervalId = setInterval(() => {
      this.loadAndScheduleReminders()
    }, this.checkIntervalMs)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    for (const timeout of this.scheduledTimeouts.values()) {
      clearTimeout(timeout)
    }
    this.scheduledTimeouts.clear()
  }

  scheduleReminder(reminder: Reminder): void {
    const dueTime = new Date(reminder.dueAt).getTime()
    const now = Date.now()
    const delay = dueTime - now

    if (delay <= 0) {
      this.fireReminder(reminder)
      return
    }

    if (this.scheduledTimeouts.has(reminder.id)) {
      clearTimeout(this.scheduledTimeouts.get(reminder.id)!)
    }

    const timeout = setTimeout(() => {
      this.fireReminder(reminder)
      this.scheduledTimeouts.delete(reminder.id)
    }, Math.min(delay, 2147483647))

    this.scheduledTimeouts.set(reminder.id, timeout)
  }

  rescheduleReminder(reminder: Reminder): void {
    if (this.scheduledTimeouts.has(reminder.id)) {
      clearTimeout(this.scheduledTimeouts.get(reminder.id)!)
      this.scheduledTimeouts.delete(reminder.id)
    }
    
    if (reminder.state === 'scheduled' || reminder.state === 'snoozed') {
      this.scheduleReminder(reminder)
    }
  }

  private loadAndScheduleReminders(): void {
    const stmt = this.db.prepare(`
      SELECT * FROM reminders 
      WHERE state IN ('scheduled', 'snoozed')
      AND dueAt <= datetime('now', '+1 hour')
    `)
    
    const reminders = stmt.all() as Reminder[]
    
    for (const reminder of reminders) {
      if (!this.scheduledTimeouts.has(reminder.id)) {
        this.scheduleReminder(reminder)
      }
    }
  }

  private fireReminder(reminder: Reminder): void {
    const bookmark = this.db.prepare(`
      SELECT * FROM bookmarks WHERE id = ?
    `).get(reminder.bookmarkId) as Bookmark | undefined

    if (!bookmark) return

    this.db.prepare(`
      UPDATE reminders SET state = 'fired', lastNotifiedAt = ?
      WHERE id = ?
    `).run(new Date().toISOString(), reminder.id)

    this.onNotify(bookmark, { ...reminder, state: 'fired' })
  }
}
