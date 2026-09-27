import { type PostgresAdapter, sql } from '@payloadcms/db-postgres'
import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
  type PayloadRequest,
} from 'payload'

import {
  type CartItem,
  type CatalogProduct,
  checkSlotAvailability,
  occupiesCapacity,
  priceCart,
  type SlotRules,
  type SlotUsage,
} from '@/lib/orders'
import type { Order, PickupSlot } from '@/payload-types'

/** Durée pendant laquelle une commande en attente de paiement réserve sa place (minimum Stripe Checkout). */
export const PAYMENT_WINDOW_MINUTES = 30

/** Espace de noms des verrous consultatifs Postgres posés sur un passage. */
const SLOT_LOCK_NAMESPACE = 7301

/** Refus métier, présentable tel quel au client. */
export class OrderRejectedError extends Error {
  constructor(readonly reasons: string[]) {
    super(reasons.join(' '))
    this.name = 'OrderRejectedError'
  }
}

export type NewOrderInput = {
  pickupSlot: number
  items: CartItem[]
  customer: { firstName: string; lastName: string; email: string; phone: string }
  customerNote?: string
  termsAccepted: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[\d\s.-]{10,20}$/
const MAX_CART_ENTRIES = 50

/** Valide une saisie client non fiable. Renvoie l'entrée normalisée ou la liste des erreurs. */
export function parseNewOrderInput(raw: unknown): NewOrderInput | string[] {
  if (!raw || typeof raw !== 'object') return ['Requête invalide.']
  const body = raw as Record<string, unknown>
  const customer = (body.customer ?? {}) as Record<string, unknown>
  const text = (value: unknown, max: number) =>
    String(value ?? '')
      .trim()
      .slice(0, max)

  const firstName = text(customer.firstName, 100)
  const lastName = text(customer.lastName, 100)
  const email = text(customer.email, 254).toLowerCase()
  const phone = text(customer.phone, 30)
  const customerNote = text(body.customerNote, 1000)
  const pickupSlot = Number(body.pickupSlot)
  const rawItems = Array.isArray(body.items) ? body.items : []

  const errors: string[] = []
  if (!Number.isInteger(pickupSlot) || pickupSlot <= 0) errors.push('Choisissez un passage.')
  if (!firstName) errors.push('Le prénom est obligatoire.')
  if (!lastName) errors.push('Le nom est obligatoire.')
  if (!EMAIL_PATTERN.test(email)) errors.push('L’adresse e-mail est invalide.')
  if (!PHONE_PATTERN.test(phone)) errors.push('Le numéro de téléphone est invalide.')
  if (body.termsAccepted !== true)
    errors.push('Vous devez accepter les conditions générales de vente.')
  if (rawItems.length === 0) errors.push('Le panier est vide.')
  if (rawItems.length > MAX_CART_ENTRIES) errors.push('Le panier contient trop d’articles.')
  if (errors.length) return errors

  const items = rawItems.map((item) => {
    const entry = (item ?? {}) as Record<string, unknown>
    return { productId: Number(entry.productId), quantity: Number(entry.quantity) }
  })
  return {
    pickupSlot,
    items,
    customer: { firstName, lastName, email, phone },
    customerNote: customerNote || undefined,
    termsAccepted: true,
  }
}

/**
 * Sérialise les prises de commande sur un même passage jusqu'à la fin de la transaction,
 * pour que deux clients ne puissent pas obtenir la dernière place en même temps.
 */
export async function lockPickupSlot(req: PayloadRequest, slotId: number): Promise<void> {
  const adapter = req.payload.db as unknown as PostgresAdapter
  const transactionID = await req.transactionID
  const session = transactionID ? adapter.sessions[transactionID] : undefined
  if (!session) throw new Error('Une transaction est requise pour verrouiller un passage.')
  await session.db.execute(sql`select pg_advisory_xact_lock(${SLOT_LOCK_NAMESPACE}, ${slotId})`)
}

/** Places et quantités déjà occupées sur un passage. */
export async function getSlotUsage(
  payload: Payload,
  slotId: number,
  now: Date,
  options: { req?: PayloadRequest; excludeOrderId?: number } = {},
): Promise<SlotUsage> {
  const { docs } = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { pickupSlot: { equals: slotId } },
        { status: { in: ['en_attente_paiement', 'payee', 'preparee', 'retiree', 'non_retiree'] } },
        ...(options.excludeOrderId ? [{ id: { not_equals: options.excludeOrderId } }] : []),
      ],
    },
    depth: 0,
    pagination: false,
    select: { status: true, expiresAt: true, items: true },
    req: options.req,
  })

  const usage: SlotUsage = { orders: 0, quantities: new Map() }
  for (const order of docs) {
    if (!occupiesCapacity(order, now)) continue
    usage.orders += 1
    for (const item of order.items ?? []) {
      const productId = typeof item.product === 'object' ? item.product?.id : item.product
      if (productId) {
        usage.quantities.set(productId, (usage.quantities.get(productId) ?? 0) + item.quantity)
      }
    }
  }
  return usage
}

export function toSlotRules(slot: PickupSlot): SlotRules {
  return {
    isOpen: Boolean(slot.isOpen),
    locationActive: typeof slot.location === 'object' ? Boolean(slot.location.active) : false,
    orderDeadline: slot.orderDeadline ?? new Date(0).toISOString(),
    maxOrders: slot.maxOrders,
    productLimits: (slot.productLimits ?? []).map((limit) => ({
      product: typeof limit.product === 'object' ? limit.product.id : limit.product,
      maxQuantity: limit.maxQuantity,
    })),
  }
}

/**
 * Crée une commande « en attente de paiement » qui réserve sa place pendant PAYMENT_WINDOW_MINUTES.
 * Prix, date limite et capacité sont vérifiés côté serveur, sous verrou du passage.
 */
export async function createPendingOrder(
  payload: Payload,
  input: NewOrderInput,
  options: { now?: Date } = {},
): Promise<Order> {
  const now = options.now ?? new Date()
  const req = await createLocalReq({}, payload)
  await initTransaction(req)
  try {
    await lockPickupSlot(req, input.pickupSlot)

    const slot = await payload.findByID({
      collection: 'pickup-slots',
      id: input.pickupSlot,
      depth: 1,
      disableErrors: true,
      req,
    })
    if (!slot) throw new OrderRejectedError(['Ce passage n’existe pas.'])

    const { docs: products } = await payload.find({
      collection: 'products',
      where: { id: { in: input.items.map((item) => item.productId) } },
      depth: 0,
      pagination: false,
      select: { name: true, priceCents: true, active: true },
      req,
    })
    const catalog = new Map<number, CatalogProduct>(
      products.map((p) => [
        p.id,
        { id: p.id, name: p.name, priceCents: p.priceCents, active: !!p.active },
      ]),
    )
    const pricing = priceCart(input.items, catalog)
    if (!pricing.ok) throw new OrderRejectedError(pricing.errors)

    const usage = await getSlotUsage(payload, slot.id, now, { req })
    const refusals = checkSlotAvailability(toSlotRules(slot), usage, pricing.lines, now)
    if (refusals.length) throw new OrderRejectedError(refusals)

    const order = await payload.create({
      collection: 'orders',
      data: {
        status: 'en_attente_paiement',
        pickupSlot: slot.id,
        customer: input.customer,
        items: pricing.lines,
        totalCents: pricing.totalCents,
        customerNote: input.customerNote,
        termsAcceptedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + PAYMENT_WINDOW_MINUTES * 60_000).toISOString(),
      },
      req,
    })
    await commitTransaction(req)
    return order
  } catch (error) {
    await killTransaction(req)
    throw error
  }
}
