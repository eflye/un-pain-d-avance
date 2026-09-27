// Règles métier des commandes, sans dépendance à Payload : testables unitairement.

export const ORDER_STATUSES = [
  { value: 'en_attente_paiement', label: 'En attente de paiement' },
  { value: 'payee', label: 'Payée' },
  { value: 'preparee', label: 'Préparée' },
  { value: 'retiree', label: 'Retirée' },
  { value: 'non_retiree', label: 'Non retirée' },
  { value: 'annulee', label: 'Annulée (non payée)' },
  { value: 'remboursee', label: 'Remboursée' },
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]['value']

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  en_attente_paiement: ['payee', 'annulee'],
  payee: ['preparee', 'retiree', 'non_retiree', 'remboursee'],
  preparee: ['retiree', 'non_retiree', 'remboursee'],
  retiree: [],
  non_retiree: ['retiree', 'remboursee'],
  annulee: [],
  remboursee: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to)
}

export function allowedNextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from]
}

export function statusLabel(status: OrderStatus): string {
  return ORDER_STATUSES.find((s) => s.value === status)?.label ?? status
}

/** Statuts qui occupent une place sur le passage (hors attente de paiement, traitée à part). */
const CONFIRMED_STATUSES: readonly OrderStatus[] = ['payee', 'preparee', 'retiree', 'non_retiree']

/** Une commande compte dans la capacité si elle est confirmée, ou en attente de paiement non expirée. */
export function occupiesCapacity(
  order: { status: OrderStatus; expiresAt?: string | null },
  now: Date,
): boolean {
  if (CONFIRMED_STATUSES.includes(order.status)) return true
  return (
    order.status === 'en_attente_paiement' &&
    !!order.expiresAt &&
    new Date(order.expiresAt).getTime() > now.getTime()
  )
}

export const MAX_QUANTITY_PER_LINE = 50

export type CartItem = { productId: number; quantity: number }

export type CatalogProduct = { id: number; name: string; priceCents: number; active: boolean }

export type OrderLine = {
  product: number
  productName: string
  unitPriceCents: number
  quantity: number
  lineTotalCents: number
}

export type PricingResult =
  { ok: true; lines: OrderLine[]; totalCents: number } | { ok: false; errors: string[] }

/**
 * Construit les lignes de commande à partir du panier et des produits en base.
 * Les prix viennent exclusivement du catalogue ; les doublons du panier sont fusionnés.
 */
export function priceCart(items: CartItem[], catalog: Map<number, CatalogProduct>): PricingResult {
  const merged = new Map<number, number>()
  for (const item of items) {
    if (
      !Number.isInteger(item.productId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return { ok: false, errors: ['Quantité invalide dans le panier.'] }
    }
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity)
  }
  if (merged.size === 0) return { ok: false, errors: ['Le panier est vide.'] }

  const errors: string[] = []
  const lines: OrderLine[] = []
  for (const [productId, quantity] of merged) {
    const product = catalog.get(productId)
    if (!product || !product.active) {
      errors.push(
        `Un produit du panier n’est plus disponible${product ? ` : ${product.name}` : ''}.`,
      )
      continue
    }
    if (quantity > MAX_QUANTITY_PER_LINE) {
      errors.push(`${product.name} : ${MAX_QUANTITY_PER_LINE} au maximum par commande.`)
      continue
    }
    lines.push({
      product: product.id,
      productName: product.name,
      unitPriceCents: product.priceCents,
      quantity,
      lineTotalCents: product.priceCents * quantity,
    })
  }
  if (errors.length) return { ok: false, errors }
  return { ok: true, lines, totalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0) }
}

export type SlotRules = {
  isOpen: boolean
  locationActive: boolean
  orderDeadline: string
  maxOrders?: number | null
  productLimits?: { product: number; maxQuantity: number }[] | null
}

export type SlotUsage = {
  /** Commandes occupant déjà une place (hors commande évaluée). */
  orders: number
  /** Quantités déjà réservées par produit (hors commande évaluée). */
  quantities: Map<number, number>
}

/** Vérifie qu'une commande peut être prise sur ce passage ; renvoie la liste des refus. */
export function checkSlotAvailability(
  slot: SlotRules,
  usage: SlotUsage,
  lines: Pick<OrderLine, 'product' | 'productName' | 'quantity'>[],
  now: Date,
): string[] {
  if (!slot.isOpen || !slot.locationActive) return ['Ce passage n’est plus ouvert aux commandes.']
  if (new Date(slot.orderDeadline).getTime() <= now.getTime()) {
    return ['La date limite de commande pour ce passage est dépassée.']
  }

  const errors: string[] = []
  if (slot.maxOrders != null && usage.orders >= slot.maxOrders) {
    errors.push('Ce passage est complet.')
  }
  for (const limit of slot.productLimits ?? []) {
    const line = lines.find((l) => l.product === limit.product)
    if (!line) continue
    const remaining = Math.max(0, limit.maxQuantity - (usage.quantities.get(limit.product) ?? 0))
    if (line.quantity > remaining) {
      errors.push(
        remaining === 0
          ? `${line.productName} : plus disponible pour ce passage.`
          : `${line.productName} : ${remaining} restant${remaining > 1 ? 's' : ''} pour ce passage.`,
      )
    }
  }
  return errors
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans 0/O, 1/I

/** Référence courte lisible au téléphone, ex. « PA-7K3F9 ». */
export function generateReference(random: (n: number) => Uint8Array = defaultRandom): string {
  const bytes = random(5)
  let code = ''
  for (const byte of bytes) code += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]
  return `PA-${code}`
}

function defaultRandom(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n))
}
