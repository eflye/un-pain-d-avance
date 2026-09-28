import { getPayload, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { orderPath, signOrderReference, verifyOrderSignature } from '@/lib/order-access'
import config from '@/payload.config'
import {
  cancelPendingOrder,
  confirmOrderPayment,
  createPendingOrder,
  PAYMENT_WINDOW_MINUTES,
} from '@/services/orders'
import { getPaymentProvider, isSimulatedPaymentEnabled, startPayment } from '@/services/payments'

import { createShopFixtures, testCustomer } from '../helpers/shopFixtures'

let payload: Payload
let shop: Awaited<ReturnType<typeof createShopFixtures>>

const minutes = (n: number) => n * 60_000

async function pendingOrder(slotId: number, options: { now?: Date } = {}) {
  return createPendingOrder(
    payload,
    {
      pickupSlot: slotId,
      items: [{ productId: shop.baguette.id, quantity: 1 }],
      customer: testCustomer,
      termsAccepted: true,
    },
    options,
  )
}

describe('Confirmation de paiement', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    shop = await createShopFixtures(payload, 'paiement')
  })

  afterAll(async () => {
    await shop.cleanup()
  })

  it('passe la commande à « Payée » une seule fois (idempotent)', async () => {
    const slot = await shop.createSlot()
    const order = await pendingOrder(slot.id)

    const first = await confirmOrderPayment(payload, order.id, { paymentIntentId: 'pi_test_1' })
    expect(first.outcome).toBe('paid')
    expect(first.order.status).toBe('payee')
    expect(first.order.paidAt).toBeTruthy()
    expect(first.order.stripePaymentIntentId).toBe('pi_test_1')

    const again = await confirmOrderPayment(payload, order.id)
    expect(again.outcome).toBe('already_paid')
    expect(again.order.paidAt).toBe(first.order.paidAt)
  })

  it('traite une seule fois deux confirmations simultanées', async () => {
    const slot = await shop.createSlot()
    const order = await pendingOrder(slot.id)
    const outcomes = await Promise.all([
      confirmOrderPayment(payload, order.id),
      confirmOrderPayment(payload, order.id),
    ])
    expect(outcomes.map((o) => o.outcome).sort()).toEqual(['already_paid', 'paid'])
  })

  it('accepte un paiement tardif s’il reste de la place', async () => {
    const slot = await shop.createSlot({ maxOrders: 2 })
    const order = await pendingOrder(slot.id)
    const late = new Date(Date.now() + minutes(PAYMENT_WINDOW_MINUTES + 5))
    expect((await confirmOrderPayment(payload, order.id, { now: late })).outcome).toBe('paid')
  })

  it('refuse un paiement tardif si la place a été reprise', async () => {
    const slot = await shop.createSlot({ maxOrders: 1 })
    const expired = await pendingOrder(slot.id, { now: new Date(Date.now() - minutes(60)) })
    // La place libérée par l'expiration est prise par un autre client, qui paie.
    const other = await pendingOrder(slot.id)
    await confirmOrderPayment(payload, other.id)

    const result = await confirmOrderPayment(payload, expired.id)
    expect(result.outcome).toBe('rejected')
    expect(result.order.status).toBe('en_attente_paiement')
    expect(result.outcome === 'rejected' && result.reasons).toEqual(['Ce passage est complet.'])
  })

  it('refuse de confirmer une commande annulée', async () => {
    const slot = await shop.createSlot()
    const order = await pendingOrder(slot.id)
    const cancelled = await cancelPendingOrder(payload, order.id)
    expect(cancelled.status).toBe('annulee')
    expect((await confirmOrderPayment(payload, order.id)).outcome).toBe('rejected')
    // Annuler une commande payée ou déjà annulée est sans effet
    expect((await cancelPendingOrder(payload, order.id)).status).toBe('annulee')
  })
})

describe('Lien d’accès à une commande', () => {
  it('vérifie la signature et refuse une signature falsifiée', () => {
    const signature = signOrderReference('PA-ABCDE')
    expect(verifyOrderSignature('PA-ABCDE', signature)).toBe(true)
    expect(verifyOrderSignature('PA-ABCDF', signature)).toBe(false)
    expect(verifyOrderSignature('PA-ABCDE', signature.slice(0, -1) + 'x')).toBe(false)
    expect(verifyOrderSignature('PA-ABCDE', undefined)).toBe(false)
    expect(orderPath('PA-ABCDE')).toBe(`/commande/PA-ABCDE?cle=${signature}`)
  })
})

describe('Prestataire de paiement', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('interdit le paiement simulé en production', () => {
    vi.stubEnv('PAYMENT_PROVIDER', 'simulated')
    vi.stubEnv('NODE_ENV', 'production')
    expect(() => getPaymentProvider()).toThrow()
    expect(isSimulatedPaymentEnabled()).toBe(false)
  })

  it('accepte le paiement simulé en production seulement sur un serveur de test déclaré', () => {
    vi.stubEnv('PAYMENT_PROVIDER', 'simulated')
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('ALLOW_SIMULATED_PAYMENT_IN_PRODUCTION', 'true')
    expect(getPaymentProvider()).toBe('simulated')
    vi.stubEnv('ALLOW_SIMULATED_PAYMENT_IN_PRODUCTION', '1')
    expect(() => getPaymentProvider()).toThrow()
  })

  it('redirige vers la page de paiement simulé en développement', async () => {
    vi.stubEnv('PAYMENT_PROVIDER', 'simulated')
    vi.stubEnv('NODE_ENV', 'development')
    const url = await startPayment({ reference: 'PA-ABCDE' } as never)
    expect(url).toBe(`/paiement-simule/PA-ABCDE?cle=${signOrderReference('PA-ABCDE')}`)
  })

  it('utilise Stripe par défaut', () => {
    vi.stubEnv('PAYMENT_PROVIDER', '')
    expect(getPaymentProvider()).toBe('stripe')
  })
})
