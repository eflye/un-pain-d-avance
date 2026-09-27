import { addDays, formatDateKey, isoWeekday, shopWallTimeToUtc, TIME_PATTERN } from '@/lib/dates'

export type DeadlineRule = {
  /** Nombre de jours avant le passage (0 = le jour même). */
  daysBefore: number
  /** Heure limite « HH:mm », heure de Paris. */
  time: string
}

export const FALLBACK_DEADLINE_RULE: DeadlineRule = { daysBefore: 1, time: '18:00' }

export const MAX_RECURRENCE_DAYS = 366

/** Date limite de commande d'un passage selon la règle par défaut. */
export function computeDefaultDeadline(dateKey: string, rule: DeadlineRule): Date {
  return shopWallTimeToUtc(addDays(dateKey, -rule.daysBefore), rule.time)
}

/** Instant de début d'un passage. */
export function slotStart(dateKey: string, startTime: string): Date {
  return shopWallTimeToUtc(dateKey, startTime)
}

/** Message d'erreur, ou null si le créneau est valide. */
export function validateSlotTimes(startTime: string, endTime: string): string | null {
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    return 'Heures attendues au format HH:mm (ex. 09:30).'
  }
  if (endTime <= startTime) return 'L’heure de fin doit être après l’heure de début.'
  return null
}

/** Message d'erreur, ou null si la date limite précède bien le début du passage. */
export function validateDeadline(deadline: Date, dateKey: string, startTime: string): string | null {
  return deadline.getTime() <= slotStart(dateKey, startTime).getTime()
    ? null
    : 'La date limite de commande doit précéder le début du passage.'
}

/** Dates (« YYYY-MM-DD ») d'un jour de semaine donné entre deux dates incluses. */
export function planRecurringDates(input: { weekday: number; from: string; to: string }): string[] {
  const { weekday, from, to } = input
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
    throw new Error('Jour de la semaine invalide.')
  }
  if (to < from) throw new Error('La date de fin doit être après la date de début.')
  if (addDays(from, MAX_RECURRENCE_DAYS) < to) {
    throw new Error(`Période trop longue (maximum ${MAX_RECURRENCE_DAYS} jours).`)
  }

  const dates: string[] = []
  for (
    let current = addDays(from, (weekday - isoWeekday(from) + 7) % 7);
    current <= to;
    current = addDays(current, 7)
  ) {
    dates.push(current)
  }
  return dates
}

/** « samedi 3 octobre 2026 · Montgeroult · 09:30–10:15 » */
export function formatSlotTitle(
  dateKey: string,
  locationName: string,
  startTime: string,
  endTime: string,
): string {
  return `${formatDateKey(dateKey)} · ${locationName} · ${startTime}–${endTime}`
}
