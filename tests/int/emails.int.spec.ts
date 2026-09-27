import { getPayload, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { buildOrderConfirmationEmail } from '@/lib/emails/order-confirmation'
import config from '@/payload.config'
import { confirmOrderPayment, createPendingOrder } from '@/services/orders'

import { createShopFixtures, testCustomer } from '../helpers/shopFixtures'

const sample = {
  shopName: "Un pain d'avance",
  reference: 'PA-7K3F9',
  firstName: 'Camille <b>',
  items: [
    { productName: 'Baguette', quantity: 2, lineTotalCents: 260 },
    { productName: 'Croissant', quantity: 1, lineTotalCents: 125 },
  ],
  totalCents: 385,
  locationName: 'Montgeroult',
  address: 'Place de l’église',
  dateKey: '2026-10-03',
  startTime: '09:30',
  endTime: '10:15',
  orderUrl: 'http://localhost:3000/commande/PA-7K3F9?cle=abc',
  contactPhone: '06 00 00 00 00',
}

describe('buildOrderConfirmationEmail', () => {
  it('donne la référence, le lieu, le créneau et le total', () => {
    const { subject, text, html } = buildOrderConfirmationEmail(sample)
    expect(subject).toBe('Commande PA-7K3F9 confirmée — retrait samedi 3 octobre 2026')
    expect(text).toContain('Référence à présenter au retrait : PA-7K3F9')
    expect(text).toContain('Quand : samedi 3 octobre 2026, de 9 h 30 à 10 h 15')
    expect(text).toContain('- Baguette × 2 : 2,60')
    expect(text).toContain(sample.orderUrl)
    expect(html).toContain('PA-7K3F9')
  })

  it('échappe le contenu saisi par le client dans le HTML', () => {
    const { html } = buildOrderConfirmationEmail(sample)
    expect(html).toContain('Camille &lt;b&gt;')
    expect(html).not.toContain('Camille <b>')
  })
})

describe('Envoi de la confirmation', () => {
  let payload: Payload
  let shop: Awaited<ReturnType<typeof createShopFixtures>>

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    shop = await createShopFixtures(payload, 'emails')
  })

  afterAll(async () => {
    await shop.cleanup()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function pendingOrder() {
    const slot = await shop.createSlot()
    return createPendingOrder(payload, {
      pickupSlot: slot.id,
      items: [{ productId: shop.baguette.id, quantity: 2 }],
      customer: testCustomer,
      termsAccepted: true,
    })
  }

  it('envoie un seul e-mail au client, au premier paiement confirmé', async () => {
    const send = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    const order = await pendingOrder()
    await confirmOrderPayment(payload, order.id)
    await confirmOrderPayment(payload, order.id)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0]).toMatchObject({
      to: testCustomer.email,
      subject: expect.stringContaining(order.reference!),
    })
  })

  it('confirme le paiement même si l’envoi de l’e-mail échoue', async () => {
    vi.spyOn(payload, 'sendEmail').mockRejectedValue(new Error('SMTP indisponible'))
    const order = await pendingOrder()
    const result = await confirmOrderPayment(payload, order.id)
    expect(result.outcome).toBe('paid')
  })
})
