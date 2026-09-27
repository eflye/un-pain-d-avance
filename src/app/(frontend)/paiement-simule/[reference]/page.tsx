import { FlaskConical } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { Notice } from '@/components/storefront/Notice'
import { Stepper } from '@/components/storefront/Stepper'
import { formatCents } from '@/lib/money'
import { orderPath, verifyOrderSignature } from '@/lib/order-access'
import config from '@/payload.config'
import { isSimulatedPaymentEnabled } from '@/services/payments'

import { simulatePaymentAbandon, simulatePaymentSuccess } from './actions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Paiement (simulation)', robots: { index: false } }

type Props = {
  params: Promise<{ reference: string }>
  searchParams: Promise<{ cle?: string }>
}

// Remplace Stripe Checkout en développement (PAYMENT_PROVIDER=simulated) ; introuvable sinon.
export default async function SimulatedPaymentPage({ params, searchParams }: Props) {
  const reference = decodeURIComponent((await params).reference)
  const { cle } = await searchParams
  if (!isSimulatedPaymentEnabled() || !verifyOrderSignature(reference, cle)) notFound()

  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'orders',
    where: { reference: { equals: reference } },
    limit: 1,
    depth: 0,
  })
  const order = docs[0]
  if (!order) notFound()
  if (order.status !== 'en_attente_paiement') redirect(orderPath(reference))

  return (
    <>
      <Stepper current={4} />
      <h1 className="mb-6 text-3xl font-bold">Paiement</h1>
      <Notice tone="warning" title="Paiement de test : aucun argent n’est débité.">
        Cette page remplace le paiement par carte en attendant la mise en service de Stripe.
      </Notice>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5">
        <p className="text-muted">Commande {order.reference}</p>
        <p className="mt-1 text-3xl font-bold">{formatCents(order.totalCents)}</p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <form action={simulatePaymentSuccess} className="flex-1">
          <input type="hidden" name="reference" value={reference} />
          <input type="hidden" name="cle" value={cle} />
          <button type="submit" className="btn-primary w-full">
            <FlaskConical aria-hidden="true" className="size-5" />
            Simuler un paiement réussi
          </button>
        </form>
        <form action={simulatePaymentAbandon} className="flex-1">
          <input type="hidden" name="reference" value={reference} />
          <input type="hidden" name="cle" value={cle} />
          <button type="submit" className="btn-secondary w-full">
            Simuler un abandon
          </button>
        </form>
      </div>
    </>
  )
}
