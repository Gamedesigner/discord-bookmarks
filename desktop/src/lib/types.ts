export interface Bookmark {
  id: string
  rawUrl: string
  guildId: string | null
  channelId: string | null
  messageId: string | null
  note: string
  status: 'active' | 'done' | 'archived'
  priority: Priority
  createdAt: string
  updatedAt: string
  reminderId?: string
  dueAt?: string
  reminderState?: ReminderState
}

export interface Reminder {
  id: string
  bookmarkId: string
  dueAt: string
  state: ReminderState
  lastNotifiedAt: string | null
}

export type Priority = 'urgent' | 'follow-up' | 'read-later' | 'none'
export type ReminderState = 'scheduled' | 'fired' | 'snoozed' | 'done'
export type BookmarkStatus = 'active' | 'done' | 'archived'

export interface ParsedDiscordUrl {
  isValid: boolean
  guildId: string | null
  channelId: string | null
  messageId: string | null
  type: 'message' | 'channel' | 'thread' | 'dm' | 'unknown'
}

export interface ReminderPreset {
  id: string
  label: string
  getDate: () => Date
}

export interface PriorityOption {
  id: Priority
  label: string
  color: string
}
