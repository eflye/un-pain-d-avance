'use server'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { orderPath, verifyOrderSignature } from '@/lib/order-access'
import config from '@/payload.config'
import { cancelPendingOrder, confirmOrderPayment } from '@/services/orders'
import { isSimulatedPaymentEnabled } from '@/services/payments'

async function findOrder(reference: string, signature: string) {
  if (!isSimulatedPaymentEnabled() || !verifyOrderSignature(reference, signature)) notFound()
  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'orders',
    where: { reference: { equals: reference } },
    limit: 1,
    depth: 0,
  })
  if (!docs[0]) notFound()
  return { payload, order: docs[0] }
}

/** Simule la confirmation du prestataire de paiement (même chemin que le futur webhook Stripe). */
export async function simulatePaymentSuccess(formData: FormData) {
  const reference = String(formData.get('reference'))
  const { payload, order } = await findOrder(reference, String(formData.get('cle')))
  await confirmOrderPayment(payload, order.id, { paymentIntentId: `simule_${order.reference}` })
  redirect(orderPath(reference))
}

/** Simule l'abandon du paiement par le client. */
export async function simulatePaymentAbandon(formData: FormData) {
  const reference = String(formData.get('reference'))
  const { payload, order } = await findOrder(reference, String(formData.get('cle')))
  await cancelPendingOrder(payload, order.id)
  redirect(orderPath(reference))
}
