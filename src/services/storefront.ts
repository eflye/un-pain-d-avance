import type { Payload } from 'payload'

import { toShopDateKey } from '@/lib/dates'
import type { Category, Location, Media, PickupSlot, Product } from '@/payload-types'
import { getSlotUsage, toSlotRules } from '@/services/orders'

// Lectures du site client. Les collections publiques sont lues avec overrideAccess: false
// pour appliquer exactement les règles d'accès des visiteurs.

export type SlotSummary = {
  id: number
  dateKey: string
  startTime: string
  endTime: string
  orderDeadline: string
  publicNote?: string | null
  /** Places restantes, ou null si le passage n'est pas limité. */
  ordersRemaining: number | null
  isFull: boolean
}

export async function getActiveLocations(payload: Payload): Promise<Location[]> {
  const { docs } = await payload.find({
    collection: 'locations',
    overrideAccess: false,
    sort: '_order',
    pagination: false,
    depth: 0,
  })
  return docs
}

export async function getLocationBySlug(payload: Payload, slug: string): Promise<Location | null> {
  const { docs } = await payload.find({
    collection: 'locations',
    overrideAccess: false,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
}

async function summarize(payload: Payload, slot: PickupSlot, now: Date): Promise<SlotSummary> {
  const usage = await getSlotUsage(payload, slot.id, now)
  const ordersRemaining = slot.maxOrders != null ? Math.max(0, slot.maxOrders - usage.orders) : null
  return {
    id: slot.id,
    dateKey: toShopDateKey(slot.date),
    startTime: slot.startTime,
    endTime: slot.endTime,
    orderDeadline: slot.orderDeadline!,
    publicNote: slot.publicNote,
    ordersRemaining,
    isFull: ordersRemaining === 0,
  }
}

/** Prochains passages ouverts d'un lieu, du plus proche au plus lointain. */
export async function getUpcomingSlots(
  payload: Payload,
  locationId: number,
  now = new Date(),
  limit = 8,
): Promise<SlotSummary[]> {
  const { docs } = await payload.find({
    collection: 'pickup-slots',
    overrideAccess: false,
    where: { location: { equals: locationId } },
    sort: 'date',
    limit,
    depth: 0,
  })
  return Promise.all(docs.map((slot) => summarize(payload, slot, now)))
}

export type OrderableSlot = SlotSummary & { location: Location }

/** Passage ouvert aux commandes (null s'il n'existe pas ou n'est plus visible du public). */
export async function getOrderableSlot(
  payload: Payload,
  slotId: number,
  now = new Date(),
): Promise<OrderableSlot | null> {
  if (!Number.isInteger(slotId) || slotId <= 0) return null
  const { docs } = await payload.find({
    collection: 'pickup-slots',
    overrideAccess: false,
    where: { id: { equals: slotId } },
    limit: 1,
    depth: 1,
  })
  const slot = docs[0]
  if (!slot || typeof slot.location !== 'object') return null
  return { ...(await summarize(payload, slot, now)), location: slot.location }
}

export type CatalogItem = {
  id: number
  name: string
  description?: string | null
  unitLabel?: string | null
  priceCents: number
  allergens: string[]
  image?: { url: string; alt: string } | null
  /** Quantité encore commandable sur ce passage, ou null si non plafonnée. */
  remaining: number | null
}

export type CatalogSection = { category: Pick<Category, 'id' | 'name'>; items: CatalogItem[] }

/** Catalogue commandable pour un passage, groupé par catégorie, avec les quantités restantes. */
export async function getCatalogForSlot(
  payload: Payload,
  slotId: number,
  now = new Date(),
): Promise<CatalogSection[]> {
  const [{ docs: categories }, { docs: products }, slot] = await Promise.all([
    payload.find({
      collection: 'categories',
      overrideAccess: false,
      sort: '_order',
      pagination: false,
      depth: 0,
    }),
    payload.find({
      collection: 'products',
      overrideAccess: false,
      sort: '_order',
      pagination: false,
      depth: 1,
    }),
    payload.findByID({ collection: 'pickup-slots', id: slotId, depth: 0 }),
  ])
  const usage = await getSlotUsage(payload, slotId, now)
  const limits = new Map(toSlotRules(slot).productLimits?.map((l) => [l.product, l.maxQuantity]))

  const toItem = (product: Product): CatalogItem => {
    const limit = limits.get(product.id)
    const image = typeof product.image === 'object' ? (product.image as Media | null) : null
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      unitLabel: product.unitLabel,
      priceCents: product.priceCents,
      allergens: product.allergens ?? [],
      image: image?.url ? { url: image.url, alt: image.alt } : null,
      remaining:
        limit === undefined ? null : Math.max(0, limit - (usage.quantities.get(product.id) ?? 0)),
    }
  }

  return categories
    .map((category) => ({
      category: { id: category.id, name: category.name },
      items: products
        .filter(
          (p) => (typeof p.category === 'object' ? p.category.id : p.category) === category.id,
        )
        .map(toItem),
    }))
    .filter((section) => section.items.length > 0)
}

export async function getShopSettings(payload: Payload) {
  return payload.findGlobal({ slug: 'shop-settings', depth: 0, overrideAccess: false })
}
