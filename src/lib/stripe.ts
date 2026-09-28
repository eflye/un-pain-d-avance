import Stripe from 'stripe'

let client: Stripe | undefined

/**
 * Client Stripe côté serveur, créé au premier usage : le module peut être chargé sans clé
 * (build de l'image, serveur de test en paiement simulé). En dev : clé sk_test_ uniquement.
 */
export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY manquant : paiement Stripe non configuré.')
    client = new Stripe(key)
  }
  return client
}
