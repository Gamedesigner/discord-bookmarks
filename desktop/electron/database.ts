import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function initDatabase(): Database.Database {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'bookmarks.db')
  
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  db = new Database(dbPath)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      rawUrl TEXT NOT NULL,
      guildId TEXT,
      channelId TEXT,
      messageId TEXT,
      note TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'done', 'archived')),
      priority TEXT DEFAULT 'none' CHECK(priority IN ('urgent', 'follow-up', 'read-later', 'none')),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      bookmarkId TEXT NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
      dueAt TEXT NOT NULL,
      state TEXT DEFAULT 'scheduled' CHECK(state IN ('scheduled', 'fired', 'snoozed', 'done')),
      lastNotifiedAt TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_reminders_dueAt ON reminders(dueAt);
    CREATE INDEX IF NOT EXISTS idx_reminders_state ON reminders(state);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_status ON bookmarks(status);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_priority ON bookmarks(priority);
  `)

  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
