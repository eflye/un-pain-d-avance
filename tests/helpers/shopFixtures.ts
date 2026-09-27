import type { Payload } from 'payload'

import { dateKeyToStorage } from '@/lib/dates'

/**
 * Jeu de données isolé (noms suffixés) : une catégorie, deux produits, un lieu,
 * et une fabrique de passages futurs sur des jours distincts. `cleanup()` supprime tout.
 */
export async function createShopFixtures(payload: Payload, label: string) {
  const suffix = `${label} ${Date.now()}`
  const category = await payload.create({
    collection: 'categories',
    data: { name: `Cat ${suffix}` },
  })
  const product = (name: string, priceCents: number) =>
    payload.create({
      collection: 'products',
      data: { name: `${name} ${suffix}`, category: category.id, priceCents, active: true },
    })
  const baguette = await product('Baguette', 120)
  const croissant = await product('Croissant', 115)
  const location = await payload.create({
    collection: 'locations',
    data: { name: `Village ${suffix}`, address: 'Place de l’église' },
  })

  const slotIds: number[] = []
  let dayOffset = 0
  const baseYear = 2028 + Math.floor(Math.random() * 50)

  async function createSlot(extra: Record<string, unknown> = {}) {
    dayOffset += 1
    const date = new Date(Date.UTC(baseYear, 0, dayOffset)).toISOString().slice(0, 10)
    const slot = await payload.create({
      collection: 'pickup-slots',
      data: {
        date: dateKeyToStorage(date),
        location: location.id,
        startTime: '09:30',
        endTime: '10:15',
        ...extra,
      },
    })
    slotIds.push(slot.id)
    return slot
  }

  async function cleanup() {
    await payload.delete({ collection: 'orders', where: { pickupSlot: { in: slotIds } } })
    await payload.delete({ collection: 'pickup-slots', where: { id: { in: slotIds } } })
    await payload.delete({ collection: 'locations', id: location.id })
    await payload.delete({
      collection: 'products',
      where: { id: { in: [baguette.id, croissant.id] } },
    })
    await payload.delete({ collection: 'categories', id: category.id })
  }

  return { suffix, category, baguette, croissant, location, createSlot, cleanup }
}

export const testCustomer = {
  firstName: 'Camille',
  lastName: 'Test',
  email: 'camille.test@example.com',
  phone: '06 12 34 56 78',
}
