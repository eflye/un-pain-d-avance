import type { Payload, PayloadRequest } from 'payload'

import { dateKeyToStorage, isDateKey } from '@/lib/dates'
import {
  type DeadlineRule,
  FALLBACK_DEADLINE_RULE,
  planRecurringDates,
  validateSlotTimes,
} from '@/lib/pickup-slots'

/** Règle de date limite par défaut, lue dans les réglages boutique. */
export async function getDeadlineRule(
  payload: Payload,
  req?: PayloadRequest,
): Promise<DeadlineRule> {
  const settings = await payload.findGlobal({ slug: 'shop-settings', depth: 0, req })
  const rule = settings.defaultDeadline
  return {
    daysBefore: rule?.daysBefore ?? FALLBACK_DEADLINE_RULE.daysBefore,
    time: rule?.time || FALLBACK_DEADLINE_RULE.time,
  }
}

export type RecurringSlotsInput = {
  location: number
  weekday: number
  startTime: string
  endTime: string
  from: string
  to: string
  maxOrders?: number | null
}

/** Valide une saisie non fiable ; renvoie un message d'erreur ou l'entrée typée. */
export function parseRecurringSlotsInput(raw: unknown): RecurringSlotsInput | string {
  if (!raw || typeof raw !== 'object') return 'Requête invalide.'
  const body = raw as Record<string, unknown>
  const location = Number(body.location)
  const weekday = Number(body.weekday)
  const maxOrders =
    body.maxOrders === undefined || body.maxOrders === null || body.maxOrders === ''
      ? null
      : Number(body.maxOrders)

  if (!Number.isInteger(location) || location <= 0) return 'Choisissez un lieu.'
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) return 'Choisissez un jour.'
  if (!isDateKey(body.from) || !isDateKey(body.to)) return 'Indiquez une période valide.'
  const startTime = String(body.startTime ?? '')
  const endTime = String(body.endTime ?? '')
  const timeError = validateSlotTimes(startTime, endTime)
  if (timeError) return timeError
  if (maxOrders !== null && (!Number.isInteger(maxOrders) || maxOrders < 1)) {
    return 'Le nombre maximal de commandes doit être un entier positif.'
  }
  return { location, weekday, startTime, endTime, from: body.from, to: body.to, maxOrders }
}

/**
 * Crée les passages d'un lieu pour chaque jour de semaine donné de la période.
 * Les dates déjà couvertes par un passage de ce lieu sont ignorées.
 */
export async function generateRecurringSlots(
  payload: Payload,
  input: RecurringSlotsInput,
  req?: PayloadRequest,
): Promise<{ created: string[]; skipped: string[] }> {
  const dates = planRecurringDates(input)
  if (dates.length === 0) return { created: [], skipped: [] }

  const existing = await payload.find({
    collection: 'pickup-slots',
    where: {
      and: [
        { location: { equals: input.location } },
        { date: { greater_than_equal: dateKeyToStorage(dates[0]) } },
        { date: { less_than_equal: dateKeyToStorage(dates[dates.length - 1]) } },
      ],
    },
    depth: 0,
    pagination: false,
    select: { date: true },
    req,
  })
  const taken = new Set(existing.docs.map((slot) => slot.date.slice(0, 10)))

  const created: string[] = []
  const skipped: string[] = []
  for (const date of dates) {
    if (taken.has(date)) {
      skipped.push(date)
      continue
    }
    await payload.create({
      collection: 'pickup-slots',
      data: {
        date: dateKeyToStorage(date),
        location: input.location,
        startTime: input.startTime,
        endTime: input.endTime,
        maxOrders: input.maxOrders ?? null,
        isOpen: true,
      },
      req,
    })
    created.push(date)
  }
  return { created, skipped }
}
