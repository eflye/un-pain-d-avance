import { describe, expect, it } from 'vitest'

import { slugify } from '@/lib/slug'

describe('slugify', () => {
  it.each([
    ['Baguette', 'baguette'],
    ['Pain au levain – 400 g', 'pain-au-levain-400-g'],
    ['Brioche retirée', 'brioche-retiree'],
    ['Œufs à la neige', 'oeufs-a-la-neige'],
    ["  Chausson aux pommes !  ", 'chausson-aux-pommes'],
    ["Pain d'épices", 'pain-d-epices'],
  ])('« %s » → « %s »', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })
})
