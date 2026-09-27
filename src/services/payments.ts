import { signOrderReference } from '@/lib/order-access'
import type { Order } from '@/payload-types'

export type PaymentProvider = 'stripe' | 'simulated'

/**
 * Prestataire de paiement actif. « simulated » remplace Stripe par une page de test locale
 * (développement sans clés Stripe) ; il est refusé en production.
 */
export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER ?? 'stripe'
  if (provider === 'simulated') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Le paiement simulé est interdit en production.')
    }
    return 'simulated'
  }
  return 'stripe'
}

export function isSimulatedPaymentEnabled(): boolean {
  try {
    return getPaymentProvider() === 'simulated'
  } catch {
    return false
  }
}

/** Démarre le paiement d'une commande en attente ; renvoie l'URL vers laquelle rediriger le client. */
export async function startPayment(order: Order): Promise<string> {
  if (getPaymentProvider() === 'simulated') {
    return `/paiement-simule/${encodeURIComponent(order.reference!)}?cle=${signOrderReference(order.reference!)}`
  }
  // Étape suivante : création de la session Stripe Checkout (expires_at = order.expiresAt).
  throw new Error('Le paiement en ligne n’est pas encore disponible.')
}
