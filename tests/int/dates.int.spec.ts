import { describe, expect, it } from 'vitest'

import {
  addDays,
  dateKeyToStorage,
  formatDateKey,
  isoWeekday,
  shopWallTimeToUtc,
  toShopDateKey,
} from '@/lib/dates'

describe('toShopDateKey', () => {
  it('prend le jour civil à Paris, pas en UTC', () => {
    // 22:30 UTC en été = 00:30 le lendemain à Paris
    expect(toShopDateKey('2026-07-14T22:30:00.000Z')).toBe('2026-07-15')
    // minuit à Paris en hiver = 23:00 UTC la veille
    expect(toShopDateKey('2026-12-24T23:00:00.000Z')).toBe('2026-12-25')
    expect(toShopDateKey(dateKeyToStorage('2026-10-03'))).toBe('2026-10-03')
  })
})

describe('shopWallTimeToUtc', () => {
  it('applique UTC+2 en été et UTC+1 en hiver', () => {
    expect(shopWallTimeToUtc('2026-07-01', '18:00').toISOString()).toBe('2026-07-01T16:00:00.000Z')
    expect(shopWallTimeToUtc('2026-12-01', '18:00').toISOString()).toBe('2026-12-01T17:00:00.000Z')
  })

  it('gère les jours de changement d’heure', () => {
    // passage à l'heure d'été le 29 mars 2026, passage à l'heure d'hiver le 25 octobre 2026
    expect(shopWallTimeToUtc('2026-03-29', '18:00').toISOString()).toBe('2026-03-29T16:00:00.000Z')
    expect(shopWallTimeToUtc('2026-10-25', '18:00').toISOString()).toBe('2026-10-25T17:00:00.000Z')
  })

  it('refuse une heure invalide', () => {
    expect(() => shopWallTimeToUtc('2026-07-01', '25:00')).toThrow()
  })
})

describe('addDays / isoWeekday / formatDateKey', () => {
  it('traverse les fins de mois et d’année', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('numérote les jours de lundi (1) à dimanche (7)', () => {
    expect(isoWeekday('2026-09-28')).toBe(1)
    expect(isoWeekday('2026-10-03')).toBe(6)
    expect(isoWeekday('2026-10-04')).toBe(7)
  })

  it('formate en français', () => {
    expect(formatDateKey('2026-10-03')).toBe('samedi 3 octobre 2026')
  })
})
