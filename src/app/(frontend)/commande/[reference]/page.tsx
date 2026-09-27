import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { ClearStoredCart } from '@/components/storefront/cart'
import { Notice } from '@/components/storefront/Notice'
import { SlotHeading } from '@/components/storefront/SlotHeading'
import { toShopDateKey } from '@/lib/dates'
import { formatCents } from '@/lib/money'
import { verifyOrderSignature } from '@/lib/order-access'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Votre commande', robots: { index: false } }

type Props = {
  params: Promise<{ reference: string }>
  searchParams: Promise<{ cle?: string }>
}

const CONFIRMED = ['payee', 'preparee', 'retiree', 'non_retiree']

// Page de suivi accessible par le lien signé (après paiement, puis depuis l'e-mail de confirmation).
export default async function OrderPage({ params, searchParams }: Props) {
  const reference = decodeURIComponent((await params).reference)
  if (!verifyOrderSignature(reference, (await searchParams).cle)) notFound()

  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'orders',
    where: { reference: { equals: reference } },
    limit: 1,
    depth: 2,
  })
  const order = docs[0]
  if (!order || typeof order.pickupSlot !== 'object') notFound()
  const slot = order.pickupSlot
  const location = typeof slot.location === 'object' ? slot.location : null
  if (!location) notFound()

  const confirmed = CONFIRMED.includes(order.status)

  return (
    <>
      {confirmed && <ClearStoredCart slotId={slot.id} />}
      <h1 className="mb-6 text-3xl font-bold">
        {confirmed
          ? 'Commande confirmée'
          : order.status === 'en_attente_paiement'
            ? 'Paiement non finalisé'
            : order.status === 'remboursee'
              ? 'Commande remboursée'
              : 'Commande annulée'}
      </h1>

      {confirmed ? (
        <Notice tone="success" role="status" title="Merci, votre paiement est enregistré.">
          {order.status === 'retiree'
            ? 'Cette commande a été retirée.'
            : 'Présentez cette référence au boulanger lors du passage.'}
        </Notice>
      ) : order.status === 'en_attente_paiement' ? (
        <Notice tone="warning" title="Votre commande n’est pas encore payée.">
          Si vous venez de payer, la confirmation peut prendre quelques instants : rechargez cette
          page. Sinon, la commande sera annulée automatiquement.
        </Notice>
      ) : (
        <Notice tone="danger" title="Cette commande ne sera pas préparée.">
          {order.status === 'remboursee'
            ? 'Le montant vous a été remboursé.'
            : 'Aucun montant n’a été débité.'}
        </Notice>
      )}

      <div className="my-8 rounded-2xl border-2 border-ink bg-white p-5 text-center">
        <p className="text-muted">Référence de commande</p>
        <p className="mt-1 text-4xl font-bold tracking-wider">{order.reference}</p>
      </div>

      <SlotHeading
        locationName={location.name}
        address={location.address}
        dateKey={toShopDateKey(slot.date)}
        startTime={slot.startTime}
        endTime={slot.endTime}
      />

      <section aria-labelledby="detail-commande">
        <h2 id="detail-commande" className="mb-3 text-xl font-bold">
          Détail
        </h2>
        <div className="rounded-2xl border border-line bg-white p-4">
          <table className="w-full text-left">
            <caption className="sr-only">Produits commandés</caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Produit</th>
                <th scope="col">Quantité</th>
                <th scope="col">Montant</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <th scope="row" className="py-2 pr-2 font-normal">
                    {item.productName}
                  </th>
                  <td className="py-2 pr-2 whitespace-nowrap text-muted">× {item.quantity}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    {formatCents(item.lineTotalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2} className="pt-3 text-lg font-bold">
                  {confirmed ? 'Total payé' : 'Total'}
                </th>
                <td className="pt-3 text-right text-lg font-bold whitespace-nowrap">
                  {formatCents(order.totalCents)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {!confirmed && (
        <Link href={`/village/${location.slug}`} className="btn-primary mt-8 w-full">
          Passer une nouvelle commande
        </Link>
      )}
    </>
  )
}
