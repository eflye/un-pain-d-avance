// Dates civiles et heures « murales » au fuseau de la boulangerie (Europe/Paris).
// Une date civile est manipulée sous forme de clé « YYYY-MM-DD » et stockée à midi UTC,
// ce qui la garde sur le bon jour quel que soit le fuseau de lecture.

export const SHOP_TIME_ZONE = 'Europe/Paris'

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SHOP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function shopParts(timestamp: number) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(new Date(timestamp)).map((p) => [p.type, p.value]),
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

/** Décalage (ms) entre l'heure de Paris et UTC à l'instant donné. */
function shopOffset(timestamp: number): number {
  const p = shopParts(timestamp)
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return wall - Math.floor(timestamp / 1000) * 1000
}

function splitDateKey(key: string): [number, number, number] {
  if (!DATE_KEY_PATTERN.test(key)) throw new Error(`Date invalide : ${key}`)
  const [y, m, d] = key.split('-').map(Number)
  return [y, m, d]
}

export function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && DATE_KEY_PATTERN.test(value)
}

/** Jour civil à Paris (« YYYY-MM-DD ») de l'instant donné. */
export function toShopDateKey(input: Date | string): string {
  const p = shopParts(new Date(input).getTime())
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

/** Valeur stockée en base pour une date civile : midi UTC. */
export function dateKeyToStorage(key: string): string {
  splitDateKey(key)
  return `${key}T12:00:00.000Z`
}

/** Instant UTC correspondant à « key à time, heure de Paris ». Gère les changements d'heure. */
export function shopWallTimeToUtc(key: string, time: string): Date {
  const [y, m, d] = splitDateKey(key)
  if (!TIME_PATTERN.test(time)) throw new Error(`Heure invalide : ${time}`)
  const [h, min] = time.split(':').map(Number)
  const asUtc = Date.UTC(y, m - 1, d, h, min)
  // Deux passes : le décalage peut différer de part et d'autre d'un changement d'heure.
  const firstGuess = asUtc - shopOffset(asUtc)
  return new Date(asUtc - shopOffset(firstGuess))
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = splitDateKey(key)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** Jour de la semaine ISO : 1 = lundi … 7 = dimanche. */
export function isoWeekday(key: string): number {
  const [y, m, d] = splitDateKey(key)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return day === 0 ? 7 : day
}

const longDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** « samedi 3 octobre 2026 » */
export function formatDateKey(key: string): string {
  return longDateFormatter.format(new Date(dateKeyToStorage(key)))
}
