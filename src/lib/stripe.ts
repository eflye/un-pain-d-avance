import Stripe from 'stripe'

// Client Stripe côté serveur uniquement. En dev, STRIPE_SECRET_KEY doit être une clé sk_test_.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')
