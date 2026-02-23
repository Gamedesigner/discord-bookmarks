import { addHours, addMinutes, addDays, setHours, setMinutes, nextSaturday, isAfter, startOfDay } from 'date-fns'
import type { ReminderPreset, PriorityOption } from './types'

export const REMINDER_PRESETS: ReminderPreset[] = [
  {
    id: 'in-15m',
    label: 'In 15 mins',
    getDate: () => addMinutes(new Date(), 15)
  },
  {
    id: 'in-30m',
    label: 'In 30 mins',
    getDate: () => addMinutes(new Date(), 30)
  },
  {
    id: 'in-1h',
    label: 'In 1 hour',
    getDate: () => addHours(new Date(), 1)
  },
  {
    id: 'in-2h',
    label: 'In 2 hours',
    getDate: () => addHours(new Date(), 2)
  },
  {
    id: 'in-4h',
    label: 'In 4 hours',
    getDate: () => addHours(new Date(), 4)
  },
  {
    id: 'in-8h',
    label: 'In 8 hours',
    getDate: () => addHours(new Date(), 8)
  },
  {
    id: 'tonight',
    label: 'Tonight',
    getDate: () => {
      const tonight = setMinutes(setHours(new Date(), 20), 0)
      if (isAfter(new Date(), tonight)) {
        return addDays(tonight, 1)
      }
      return tonight
    }
  },
  {
    id: 'tomorrow',
    label: 'Tomorrow',
    getDate: () => setMinutes(setHours(addDays(startOfDay(new Date()), 1), 9), 0)
  },
  {
    id: 'weekend',
    label: 'This weekend',
    getDate: () => setMinutes(setHours(nextSaturday(new Date()), 10), 0)
  }
]

export const SNOOZE_PRESETS: ReminderPreset[] = [
  {
    id: 'snooze-15m',
    label: '+15 min',
    getDate: () => addHours(new Date(), 0.25)
  },
  {
    id: 'snooze-1h',
    label: '+1 hour',
    getDate: () => addHours(new Date(), 1)
  },
  {
    id: 'snooze-tomorrow',
    label: 'Tomorrow',
    getDate: () => setMinutes(setHours(addDays(startOfDay(new Date()), 1), 9), 0)
  }
]

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { id: 'urgent', label: 'Urgent', color: 'red' },
  { id: 'follow-up', label: 'Follow-up', color: 'yellow' },
  { id: 'read-later', label: 'Read later', color: 'green' },
  { id: 'none', label: 'No priority', color: 'gray' }
]
