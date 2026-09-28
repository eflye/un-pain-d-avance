import type { Payload } from 'payload'

import { toShopDateKey } from '@/lib/dates'
import { buildOrderConfirmationEmail } from '@/lib/emails/order-confirmation'
import { orderPath } from '@/lib/order-access'
import type { Order } from '@/payload-types'

function serverUrl(): string {
  // Lue à l'exécution (pas de NEXT_PUBLIC_ : ce serait figé dans l'image au build).
  return (process.env.SERVER_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

/**
 * Envoie l'e-mail de confirmation d'une commande payée.
 * Ne lève jamais : un échec d'envoi ne doit pas remettre en cause un paiement enregistré.
 */
export async function sendOrderConfirmation(payload: Payload, orderId: number): Promise<boolean> {
  try {
    const order: Order = await payload.findByID({ collection: 'orders', id: orderId, depth: 2 })
    const slot = order.pickupSlot
    if (typeof slot !== 'object' || typeof slot.location !== 'object') {
      throw new Error('passage ou lieu introuvable')
    }
    const settings = await payload.findGlobal({ slug: 'shop-settings', depth: 0 })
    const email = buildOrderConfirmationEmail({
      shopName: settings.shopName,
      reference: order.reference!,
      firstName: order.customer.firstName,
      items: order.items,
      totalCents: order.totalCents,
      locationName: slot.location.name,
      address: slot.location.address,
      directions: slot.location.directions,
      dateKey: toShopDateKey(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      orderUrl: `${serverUrl()}${orderPath(order.reference!)}`,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
    })
    await payload.sendEmail({ to: order.customer.email, ...email })
    return true
  } catch (error) {
    // Journal sans donnée personnelle : identifiant technique seulement.
    payload.logger.error(
      `E-mail de confirmation non envoyé (commande #${orderId}) : ${(error as Error).message}`,
    )
    return false
  }
}
