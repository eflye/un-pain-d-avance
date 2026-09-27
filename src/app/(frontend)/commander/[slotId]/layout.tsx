import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { CartProvider } from '@/components/storefront/cart'
import { Notice } from '@/components/storefront/Notice'
import config from '@/payload.config'
import { getCatalogForSlot, getOrderableSlot } from '@/services/storefront'

export const dynamic = 'force-dynamic'

/** Étapes 2 et 3 d'un passage : partagent le panier et vérifient que le passage est ouvert. */
export default async function OrderLayout({
  params,
  children,
}: {
  params: Promise<{ slotId: string }>
  children: React.ReactNode
}) {
  const payload = await getPayload({ config: await config })
  const slot = await getOrderableSlot(payload, Number((await params).slotId))

  if (!slot || slot.isFull) {
    return (
      <>
        <h1 className="mb-6 text-3xl font-bold">Commande impossible</h1>
        <Notice
          tone="warning"
          title={slot ? 'Ce passage est complet.' : 'Ce passage n’est plus ouvert aux commandes.'}
        >
          La date limite est peut-être dépassée. Choisissez un autre passage.
        </Notice>
        <Link href={slot ? `/village/${slot.location.slug}` : '/'} className="btn-secondary mt-6">
          Voir les autres passages
        </Link>
      </>
    )
  }

  const sections = await getCatalogForSlot(payload, slot.id)
  return (
    <CartProvider slotId={slot.id} catalog={sections.flatMap((section) => section.items)}>
      {children}
    </CartProvider>
  )
}
