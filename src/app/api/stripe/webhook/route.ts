import type Stripe from 'stripe'

import { getStripe } from '@/lib/stripe'

// Source de vérité du paiement : une commande n'est confirmée qu'à réception de ce webhook,
// jamais sur la page de retour de Stripe Checkout.
export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    )
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${(err as Error).message}`, {
      status: 400,
    })
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // TODO: passer la commande correspondante à "payée" et décrémenter le stock du jour
      break
    default:
      break
  }

  return Response.json({ received: true })
}
