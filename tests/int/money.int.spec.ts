import { describe, expect, it } from 'vitest'

import { centsToEuroInput, formatCents, parseEurosToCents } from '@/lib/money'

describe('parseEurosToCents', () => {
  it.each([
    ['2,50', 250],
    ['2.50', 250],
    ['2,5', 250],
    ['3', 300],
    ['0,05', 5],
    [' 1 200,00 € ', 120000],
    ['1 200,99', 120099],
  ])('convertit « %s » en %i centimes', (input, expected) => {
    expect(parseEurosToCents(input)).toBe(expected)
  })

  it.each(['', 'abc', '2,505', '-1', '1,2,3', ',50'])('refuse « %s »', (input) => {
    expect(parseEurosToCents(input)).toBeNull()
  })
})

describe('centsToEuroInput', () => {
  it.each([
    [250, '2,50'],
    [5, '0,05'],
    [120000, '1200,00'],
  ])('%i centimes → « %s »', (cents, expected) => {
    expect(centsToEuroInput(cents)).toBe(expected)
  })

  it('fait un aller-retour sans perte', () => {
    for (const cents of [1, 99, 100, 1234, 99999]) {
      expect(parseEurosToCents(centsToEuroInput(cents))).toBe(cents)
    }
  })
})

describe('formatCents', () => {
  it('formate en euros à la française', () => {
    expect(formatCents(250).replace(/\s/g, ' ')).toBe('2,50 €')
  })
})
