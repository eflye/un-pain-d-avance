import { describe, expect, it } from 'vitest'

import {
  computeDefaultDeadline,
  formatSlotTitle,
  planRecurringDates,
  validateDeadline,
  validateSlotTimes,
} from '@/lib/pickup-slots'

describe('computeDefaultDeadline', () => {
  it('la veille à 18:00, heure de Paris', () => {
    expect(computeDefaultDeadline('2026-10-03', { daysBefore: 1, time: '18:00' }).toISOString()).toBe(
      '2026-10-02T16:00:00.000Z',
    )
    expect(computeDefaultDeadline('2026-12-05', { daysBefore: 1, time: '18:00' }).toISOString()).toBe(
      '2026-12-04T17:00:00.000Z',
    )
  })

  it('le jour même ou plusieurs jours avant', () => {
    expect(computeDefaultDeadline('2026-10-03', { daysBefore: 0, time: '07:00' }).toISOString()).toBe(
      '2026-10-03T05:00:00.000Z',
    )
    expect(computeDefaultDeadline('2026-10-03', { daysBefore: 3, time: '12:00' }).toISOString()).toBe(
      '2026-09-30T10:00:00.000Z',
    )
  })
})

describe('validateSlotTimes', () => {
  it('accepte un créneau cohérent', () => {
    expect(validateSlotTimes('09:30', '10:15')).toBeNull()
  })

  it.each([
    ['10:15', '09:30'],
    ['09:30', '09:30'],
    ['9:30', '10:15'],
    ['09:30', '24:00'],
  ])('refuse %s–%s', (start, end) => {
    expect(validateSlotTimes(start, end)).not.toBeNull()
  })
})

describe('validateDeadline', () => {
  it('exige une date limite avant le début du passage', () => {
    expect(validateDeadline(new Date('2026-10-03T07:29:00Z'), '2026-10-03', '09:30')).toBeNull()
    expect(validateDeadline(new Date('2026-10-03T07:31:00Z'), '2026-10-03', '09:30')).not.toBeNull()
  })
})

describe('planRecurringDates', () => {
  it('liste tous les samedis d’octobre 2026', () => {
    expect(planRecurringDates({ weekday: 6, from: '2026-10-01', to: '2026-10-31' })).toEqual([
      '2026-10-03',
      '2026-10-10',
      '2026-10-17',
      '2026-10-24',
      '2026-10-31',
    ])
  })

  it('inclut la date de début si elle tombe le bon jour', () => {
    expect(planRecurringDates({ weekday: 6, from: '2026-10-03', to: '2026-10-09' })).toEqual([
      '2026-10-03',
    ])
  })

  it('accepte une année complète', () => {
    expect(planRecurringDates({ weekday: 6, from: '2027-01-01', to: '2028-01-01' })).toHaveLength(53)
  })

  it('refuse une période inversée, trop longue ou un jour invalide', () => {
    expect(() => planRecurringDates({ weekday: 6, from: '2026-10-31', to: '2026-10-01' })).toThrow()
    expect(() => planRecurringDates({ weekday: 6, from: '2026-01-01', to: '2027-06-01' })).toThrow()
    expect(() => planRecurringDates({ weekday: 0, from: '2026-10-01', to: '2026-10-31' })).toThrow()
  })
})

describe('formatSlotTitle', () => {
  it('résume le passage', () => {
    expect(formatSlotTitle('2026-10-03', 'Montgeroult', '09:30', '10:15')).toBe(
      'samedi 3 octobre 2026 · Montgeroult · 09:30–10:15',
    )
  })
})
