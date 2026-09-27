import type { Metadata } from 'next'
import { getPayload } from 'payload'
import React from 'react'

import { CatalogList } from '@/components/storefront/CatalogList'
import { ContinueButton } from '@/components/storefront/ContinueButton'
import { Notice } from '@/components/storefront/Notice'
import { SlotHeading } from '@/components/storefront/SlotHeading'
import { Stepper } from '@/components/storefront/Stepper'
import { SummaryBar } from '@/components/storefront/SummaryBar'
import { formatShopDateTime } from '@/lib/dates'
import config from '@/payload.config'
import { getCatalogForSlot, getOrderableSlot } from '@/services/storefront'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Vos produits' }

export default async function ProductsStep({ params }: { params: Promise<{ slotId: string }> }) {
  const payload = await getPayload({ config: await config })
  const slot = await getOrderableSlot(payload, Number((await params).slotId))
  // Le layout affiche le message « Commande impossible » ; il est rendu en parallèle de la page.
  if (!slot || slot.isFull) return null
  const sections = await getCatalogForSlot(payload, slot.id)

  return (
    <>
      <Stepper current={2} />
      <h1 className="mb-4 text-3xl font-bold">Vos produits</h1>
      <SlotHeading
        locationName={slot.location.name}
        address={slot.location.address}
        dateKey={slot.dateKey}
        startTime={slot.startTime}
        endTime={slot.endTime}
        changeHref={`/village/${slot.location.slug}`}
      />
      <p className="-mt-4 mb-8 text-muted">
        Commandes possibles jusqu&apos;au {formatShopDateTime(slot.orderDeadline)}.
      </p>
      {sections.length === 0 ? (
        <Notice title="Aucun produit n’est en vente pour le moment." />
      ) : (
        <CatalogList sections={sections} />
      )}
      <SummaryBar>
        <ContinueButton href={`/commander/${slot.id}/coordonnees`} />
      </SummaryBar>
    </>
  )
}
