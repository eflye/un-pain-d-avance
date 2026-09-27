import { describe, expect, it } from 'vitest'

import {
  type CatalogProduct,
  canTransition,
  checkSlotAvailability,
  generateReference,
  MAX_QUANTITY_PER_LINE,
  occupiesCapacity,
  priceCart,
  type SlotRules,
} from '@/lib/orders'

const now = new Date('2027-03-01T10:00:00.000Z')

const catalog = new Map<number, CatalogProduct>([
  [1, { id: 1, name: 'Baguette', priceCents: 120, active: true }],
  [2, { id: 2, name: 'Croissant', priceCents: 115, active: true }],
  [3, { id: 3, name: 'Brioche', priceCents: 650, active: false }],
])

describe('priceCart', () => {
  it('calcule les lignes et le total à partir des prix du catalogue', () => {
    const result = priceCart(
      [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 3 },
      ],
      catalog,
    )
    expect(result).toEqual({
      ok: true,
      totalCents: 2 * 120 + 3 * 115,
      lines: [
        {
          product: 1,
          productName: 'Baguette',
          unitPriceCents: 120,
          quantity: 2,
          lineTotalCents: 240,
        },
        {
          product: 2,
          productName: 'Croissant',
          unitPriceCents: 115,
          quantity: 3,
          lineTotalCents: 345,
        },
      ],
    })
  })

  it('fusionne les doublons du panier', () => {
    const result = priceCart(
      [
        { productId: 1, quantity: 1 },
        { productId: 1, quantity: 2 },
      ],
      catalog,
    )
    expect(result.ok && result.lines).toEqual([
      expect.objectContaining({ product: 1, quantity: 3 }),
    ])
  })

  it.each([
    ['panier vide', []],
    ['quantité nulle', [{ productId: 1, quantity: 0 }]],
    ['quantité décimale', [{ productId: 1, quantity: 1.5 }]],
    ['produit inconnu', [{ productId: 99, quantity: 1 }]],
    ['produit retiré de la vente', [{ productId: 3, quantity: 1 }]],
    ['quantité excessive', [{ productId: 1, quantity: MAX_QUANTITY_PER_LINE + 1 }]],
  ])('refuse : %s', (_label, items) => {
    expect(priceCart(items, catalog).ok).toBe(false)
  })
})

describe('checkSlotAvailability', () => {
  const slot: SlotRules = {
    isOpen: true,
    locationActive: true,
    orderDeadline: '2027-03-05T17:00:00.000Z',
    maxOrders: 10,
    productLimits: [{ product: 2, maxQuantity: 20 }],
  }
  const noUsage = { orders: 0, quantities: new Map<number, number>() }
  const lines = [{ product: 2, productName: 'Croissant', quantity: 5 }]

  it('accepte une commande dans les limites', () => {
    expect(checkSlotAvailability(slot, noUsage, lines, now)).toEqual([])
  })

  it('refuse un passage fermé, un lieu inactif ou une date limite dépassée', () => {
    expect(checkSlotAvailability({ ...slot, isOpen: false }, noUsage, lines, now)).toHaveLength(1)
    expect(
      checkSlotAvailability({ ...slot, locationActive: false }, noUsage, lines, now),
    ).toHaveLength(1)
    expect(
      checkSlotAvailability(slot, noUsage, lines, new Date('2027-03-05T17:00:00.000Z')),
    ).toEqual(['La date limite de commande pour ce passage est dépassée.'])
  })

  it('refuse quand le passage est complet', () => {
    expect(checkSlotAvailability(slot, { ...noUsage, orders: 10 }, lines, now)).toEqual([
      'Ce passage est complet.',
    ])
  })

  it('indique la quantité restante d’un produit plafonné', () => {
    const usage = { orders: 3, quantities: new Map([[2, 17]]) }
    expect(checkSlotAvailability(slot, usage, lines, now)).toEqual([
      'Croissant : 3 restants pour ce passage.',
    ])
    const soldOut = { orders: 3, quantities: new Map([[2, 20]]) }
    expect(checkSlotAvailability(slot, soldOut, lines, now)).toEqual([
      'Croissant : plus disponible pour ce passage.',
    ])
  })

  it('ne limite rien quand aucun plafond n’est défini', () => {
    const unlimited = { ...slot, maxOrders: null, productLimits: null }
    const usage = { orders: 500, quantities: new Map([[2, 500]]) }
    expect(checkSlotAvailability(unlimited, usage, lines, now)).toEqual([])
  })
})

describe('occupiesCapacity', () => {
  it('compte les commandes confirmées et les paiements en cours non expirés', () => {
    expect(occupiesCapacity({ status: 'payee' }, now)).toBe(true)
    expect(occupiesCapacity({ status: 'non_retiree' }, now)).toBe(true)
    expect(
      occupiesCapacity(
        { status: 'en_attente_paiement', expiresAt: '2027-03-01T10:30:00.000Z' },
        now,
      ),
    ).toBe(true)
  })

  it('ignore les paiements expirés, les annulations et les remboursements', () => {
    expect(
      occupiesCapacity(
        { status: 'en_attente_paiement', expiresAt: '2027-03-01T09:59:00.000Z' },
        now,
      ),
    ).toBe(false)
    expect(occupiesCapacity({ status: 'annulee' }, now)).toBe(false)
    expect(occupiesCapacity({ status: 'remboursee' }, now)).toBe(false)
  })
})

describe('canTransition', () => {
  it.each([
    ['en_attente_paiement', 'payee'],
    ['en_attente_paiement', 'annulee'],
    ['payee', 'preparee'],
    ['payee', 'retiree'],
    ['preparee', 'retiree'],
    ['preparee', 'non_retiree'],
    ['non_retiree', 'retiree'],
    ['payee', 'remboursee'],
    ['retiree', 'retiree'],
  ] as const)('autorise %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true)
  })

  it.each([
    ['en_attente_paiement', 'preparee'],
    ['en_attente_paiement', 'remboursee'],
    ['payee', 'en_attente_paiement'],
    ['payee', 'annulee'],
    ['retiree', 'preparee'],
    ['annulee', 'payee'],
    ['remboursee', 'payee'],
  ] as const)('refuse %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false)
  })
})

describe('generateReference', () => {
  it('produit une référence courte sans caractères ambigus', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateReference()).toMatch(/^PA-[A-HJ-NP-Z2-9]{5}$/)
    }
  })
})
