import type { Metadata } from 'next'
import { getPayload } from 'payload'
import React from 'react'

import { CheckoutForm } from '@/components/storefront/CheckoutForm'
import { SlotHeading } from '@/components/storefront/SlotHeading'
import { Stepper } from '@/components/storefront/Stepper'
import config from '@/payload.config'
import { getOrderableSlot } from '@/services/storefront'

import { placeOrder } from './actions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Vos coordonnées' }

export default async function DetailsStep({ params }: { params: Promise<{ slotId: string }> }) {
  const payload = await getPayload({ config: await config })
  const slot = await getOrderableSlot(payload, Number((await params).slotId))
  // Le layout affiche le message « Commande impossible » ; il est rendu en parallèle de la page.
  if (!slot || slot.isFull) return null

  return (
    <>
      <Stepper current={3} />
      <h1 className="mb-4 text-3xl">Vos coordonnées</h1>
      <SlotHeading
        locationName={slot.location.name}
        address={slot.location.address}
        dateKey={slot.dateKey}
        startTime={slot.startTime}
        endTime={slot.endTime}
      />
      <CheckoutForm action={placeOrder} productsHref={`/commander/${slot.id}`} />
    </>
  )
}
