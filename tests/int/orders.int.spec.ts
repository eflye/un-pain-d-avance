import { randomUUID } from 'crypto'
import { getPayload, type Payload, ValidationError } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { dateKeyToStorage } from '@/lib/dates'
import type { User } from '@/payload-types'
import config from '@/payload.config'
import {
  createPendingOrder,
  type NewOrderInput,
  OrderRejectedError,
  parseNewOrderInput,
  PAYMENT_WINDOW_MINUTES,
} from '@/services/orders'

let payload: Payload
let admin: User
const ids = {
  category: 0,
  location: 0,
  baguette: 0,
  croissant: 0,
  retired: 0,
  slots: [] as number[],
}
const suffix = Date.now()
const customer = {
  firstName: 'Camille',
  lastName: 'Test',
  email: 'camille.test@example.com',
  phone: '06 12 34 56 78',
}

let dayOffset = 0
/** Crée un passage futur, sur un jour distinct à chaque appel. */
async function createSlot(extra: Record<string, unknown> = {}) {
  dayOffset += 1
  const date = new Date(Date.UTC(2027, 8, 1 + dayOffset)).toISOString().slice(0, 10)
  const slot = await payload.create({
    collection: 'pickup-slots',
    data: {
      date: dateKeyToStorage(date),
      location: ids.location,
      startTime: '09:30',
      endTime: '10:15',
      ...extra,
    },
  })
  ids.slots.push(slot.id)
  return slot.id
}

function orderInput(pickupSlot: number, items: NewOrderInput['items']): NewOrderInput {
  return { pickupSlot, items, customer, termsAccepted: true }
}

async function rejection(promise: Promise<unknown>): Promise<string[]> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  )
  expect(error).toBeInstanceOf(OrderRejectedError)
  return (error as OrderRejectedError).reasons
}

describe('Commandes', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    admin = await payload.create({
      collection: 'users',
      data: { email: `admin-${suffix}@example.com`, password: randomUUID() },
    })
    ids.category = (
      await payload.create({ collection: 'categories', data: { name: `Pains ${suffix}` } })
    ).id
    const product = async (name: string, priceCents: number, active = true) =>
      (
        await payload.create({
          collection: 'products',
          data: { name: `${name} ${suffix}`, category: ids.category, priceCents, active },
        })
      ).id
    ids.baguette = await product('Baguette', 120)
    ids.croissant = await product('Croissant', 115)
    ids.retired = await product('Retiré', 500, false)
    ids.location = (
      await payload.create({
        collection: 'locations',
        data: { name: `Village commandes ${suffix}`, address: 'Place' },
      })
    ).id
  })

  afterAll(async () => {
    await payload.delete({ collection: 'orders', where: { pickupSlot: { in: ids.slots } } })
    await payload.delete({ collection: 'pickup-slots', where: { id: { in: ids.slots } } })
    await payload.delete({ collection: 'locations', id: ids.location })
    await payload.delete({
      collection: 'products',
      where: { id: { in: [ids.baguette, ids.croissant, ids.retired] } },
    })
    await payload.delete({ collection: 'categories', id: ids.category })
    await payload.delete({ collection: 'users', id: admin.id })
  })

  it('crée une commande en attente de paiement aux prix du catalogue', async () => {
    const slot = await createSlot()
    const now = new Date()
    const order = await createPendingOrder(
      payload,
      orderInput(slot, [
        { productId: ids.baguette, quantity: 2 },
        { productId: ids.croissant, quantity: 1 },
      ]),
      { now },
    )
    expect(order.status).toBe('en_attente_paiement')
    expect(order.reference).toMatch(/^PA-[A-Z2-9]{5}$/)
    expect(order.totalCents).toBe(2 * 120 + 115)
    expect(order.items.map((i) => [i.productName, i.unitPriceCents, i.quantity])).toEqual([
      [`Baguette ${suffix}`, 120, 2],
      [`Croissant ${suffix}`, 115, 1],
    ])
    expect(new Date(order.expiresAt!).getTime() - now.getTime()).toBe(
      PAYMENT_WINDOW_MINUTES * 60_000,
    )
    expect(order.termsAcceptedAt).toBe(now.toISOString())
  })

  it('refuse un produit retiré de la vente', async () => {
    const slot = await createSlot()
    const reasons = await rejection(
      createPendingOrder(payload, orderInput(slot, [{ productId: ids.retired, quantity: 1 }])),
    )
    expect(reasons[0]).toMatch(/plus disponible/)
  })

  it('refuse un passage fermé, clos ou inexistant', async () => {
    const closed = await createSlot({ isOpen: false })
    const past = await createSlot({ orderDeadline: '2020-01-01T00:00:00.000Z' })
    const items = [{ productId: ids.baguette, quantity: 1 }]
    expect(await rejection(createPendingOrder(payload, orderInput(closed, items)))).toEqual([
      'Ce passage n’est plus ouvert aux commandes.',
    ])
    expect(await rejection(createPendingOrder(payload, orderInput(past, items)))).toEqual([
      'La date limite de commande pour ce passage est dépassée.',
    ])
    expect(await rejection(createPendingOrder(payload, orderInput(999999, items)))).toEqual([
      'Ce passage n’existe pas.',
    ])
  })

  it('refuse une commande quand le passage est complet', async () => {
    const slot = await createSlot({ maxOrders: 2 })
    const items = [{ productId: ids.baguette, quantity: 1 }]
    await createPendingOrder(payload, orderInput(slot, items))
    await createPendingOrder(payload, orderInput(slot, items))
    expect(await rejection(createPendingOrder(payload, orderInput(slot, items)))).toEqual([
      'Ce passage est complet.',
    ])
  })

  it('libère la place d’un paiement expiré', async () => {
    const slot = await createSlot({ maxOrders: 1 })
    const items = [{ productId: ids.baguette, quantity: 1 }]
    const longAgo = new Date(Date.now() - 2 * PAYMENT_WINDOW_MINUTES * 60_000)
    await createPendingOrder(payload, orderInput(slot, items), { now: longAgo })
    await expect(createPendingOrder(payload, orderInput(slot, items))).resolves.toBeDefined()
  })

  it('respecte le plafond par produit et indique le reste', async () => {
    const slot = await createSlot({
      productLimits: [{ product: ids.croissant, maxQuantity: 3 }],
    })
    await createPendingOrder(payload, orderInput(slot, [{ productId: ids.croissant, quantity: 2 }]))
    const reasons = await rejection(
      createPendingOrder(payload, orderInput(slot, [{ productId: ids.croissant, quantity: 2 }])),
    )
    expect(reasons).toEqual([`Croissant ${suffix} : 1 restant pour ce passage.`])
  })

  it('ne vend pas deux fois la dernière place en cas de commandes simultanées', async () => {
    const slot = await createSlot({ maxOrders: 1 })
    const items = [{ productId: ids.baguette, quantity: 1 }]
    const results = await Promise.allSettled([
      createPendingOrder(payload, orderInput(slot, items)),
      createPendingOrder(payload, orderInput(slot, items)),
      createPendingOrder(payload, orderInput(slot, items)),
    ])
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    for (const result of results.filter((r) => r.status === 'rejected')) {
      expect((result as PromiseRejectedResult).reason).toBeInstanceOf(OrderRejectedError)
    }
  })

  describe('droits et statuts', () => {
    let orderId: number
    beforeAll(async () => {
      const slot = await createSlot()
      orderId = (
        await createPendingOrder(
          payload,
          orderInput(slot, [{ productId: ids.baguette, quantity: 1 }]),
        )
      ).id
    })

    it('interdit aux visiteurs de lire ou de créer des commandes', async () => {
      await expect(payload.find({ collection: 'orders', overrideAccess: false })).rejects.toThrow()
      await expect(
        payload.findByID({ collection: 'orders', id: orderId, overrideAccess: false }),
      ).rejects.toThrow()
    })

    it('interdit au gestionnaire de créer ou supprimer une commande', async () => {
      await expect(
        payload.delete({ collection: 'orders', id: orderId, user: admin, overrideAccess: false }),
      ).rejects.toThrow()
    })

    it('empêche le gestionnaire de modifier le montant', async () => {
      const updated = await payload.update({
        collection: 'orders',
        id: orderId,
        data: { totalCents: 1, internalNote: 'vu' },
        user: admin,
        overrideAccess: false,
      })
      expect(updated.totalCents).toBe(120)
      expect(updated.internalNote).toBe('vu')
    })

    it('réserve le statut « Payée » à la confirmation Stripe', async () => {
      const error = await payload
        .update({
          collection: 'orders',
          id: orderId,
          data: { status: 'payee' },
          user: admin,
          overrideAccess: false,
        })
        .catch((e: unknown) => e)
      expect(error).toBeInstanceOf(ValidationError)
      // Sans utilisateur : chemin du webhook Stripe
      const paid = await payload.update({
        collection: 'orders',
        id: orderId,
        data: { status: 'payee' },
      })
      expect(paid.status).toBe('payee')
    })

    it('refuse les changements de statut incohérents', async () => {
      const error = await payload
        .update({
          collection: 'orders',
          id: orderId,
          data: { status: 'en_attente_paiement' },
          user: admin,
          overrideAccess: false,
        })
        .catch((e: unknown) => e)
      expect(error).toBeInstanceOf(ValidationError)
      const prepared = await payload.update({
        collection: 'orders',
        id: orderId,
        data: { status: 'preparee' },
        user: admin,
        overrideAccess: false,
      })
      expect(prepared.status).toBe('preparee')
    })

    it('empêche de supprimer un produit ou un passage commandé', async () => {
      await expect(payload.delete({ collection: 'products', id: ids.baguette })).rejects.toThrow(
        /commandes/,
      )
      await expect(
        payload.delete({ collection: 'pickup-slots', id: ids.slots[0] }),
      ).rejects.toThrow(/commandes/)
    })
  })
})

describe('parseNewOrderInput', () => {
  const valid = {
    pickupSlot: 12,
    items: [{ productId: 3, quantity: 2 }],
    customer: {
      firstName: ' Camille ',
      lastName: 'Martin',
      email: 'Camille@Example.com',
      phone: '06 12 34 56 78',
    },
    termsAccepted: true,
  }

  it('normalise une saisie valide', () => {
    expect(parseNewOrderInput(valid)).toMatchObject({
      pickupSlot: 12,
      customer: { firstName: 'Camille', email: 'camille@example.com' },
    })
  })

  it.each([
    ['sans CGV', { ...valid, termsAccepted: false }],
    ['e-mail invalide', { ...valid, customer: { ...valid.customer, email: 'camille' } }],
    ['téléphone invalide', { ...valid, customer: { ...valid.customer, phone: '12' } }],
    ['sans prénom', { ...valid, customer: { ...valid.customer, firstName: '  ' } }],
    ['panier vide', { ...valid, items: [] }],
    ['sans passage', { ...valid, pickupSlot: 'abc' }],
  ])('refuse : %s', (_label, input) => {
    expect(Array.isArray(parseNewOrderInput(input))).toBe(true)
  })
})
