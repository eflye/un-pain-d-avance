import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload
let categoryId: number
const productIds: number[] = []

describe('Catalogue', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const category = await payload.create({
      collection: 'categories',
      data: { name: `Test catalogue ${Date.now()}` },
    })
    categoryId = category.id

    for (const [name, active] of [
      ['Baguette test', true],
      ['Brioche retirée test', false],
    ] as const) {
      const product = await payload.create({
        collection: 'products',
        data: { name, category: categoryId, priceCents: 120, active, allergens: ['gluten'] },
      })
      productIds.push(product.id)
    }
  })

  afterAll(async () => {
    await payload.delete({ collection: 'products', where: { id: { in: productIds } } })
    await payload.delete({ collection: 'categories', id: categoryId })
  })

  it('ne montre aux visiteurs que les produits en vente', async () => {
    const { docs } = await payload.find({
      collection: 'products',
      overrideAccess: false,
      where: { category: { equals: categoryId } },
    })
    expect(docs.map((p) => p.name)).toEqual(['Baguette test'])
  })

  it('refuse aux visiteurs de créer ou modifier un produit', async () => {
    await expect(
      payload.create({
        collection: 'products',
        overrideAccess: false,
        data: { name: 'Intrus', category: categoryId, priceCents: 100 },
      }),
    ).rejects.toThrow()

    await expect(
      payload.update({
        collection: 'products',
        id: productIds[0],
        overrideAccess: false,
        data: { priceCents: 1 },
      }),
    ).rejects.toThrow()
  })

  it('génère le slug depuis le nom', async () => {
    const product = await payload.findByID({ collection: 'products', id: productIds[0] })
    expect(product.slug).toBe('baguette-test')
    const [, inactive] = await Promise.all(
      productIds.map((id) => payload.findByID({ collection: 'products', id })),
    )
    expect(inactive.slug).toBe('brioche-retiree-test')
  })

  it.each([0, -50, 2.5])('refuse un prix en centimes invalide (%s)', async (priceCents) => {
    await expect(
      payload.create({
        collection: 'products',
        data: { name: 'Prix invalide', category: categoryId, priceCents },
      }),
    ).rejects.toThrow()
  })
})
