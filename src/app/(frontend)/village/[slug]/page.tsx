import { ChevronRight, Clock, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { Notice } from '@/components/storefront/Notice'
import { Stepper } from '@/components/storefront/Stepper'
import { formatDateKey, formatShopDateTime, formatTime } from '@/lib/dates'
import config from '@/payload.config'
import { getLocationBySlug, getUpcomingSlots, type SlotSummary } from '@/services/storefront'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const payload = await getPayload({ config: await config })
  const location = await getLocationBySlug(payload, (await params).slug)
  return { title: location ? `Commander à ${location.name}` : 'Village introuvable' }
}

function Availability({ slot }: { slot: SlotSummary }) {
  if (slot.isFull) return <span className="font-bold text-danger">Complet</span>
  if (slot.ordersRemaining !== null && slot.ordersRemaining <= 5) {
    return (
      <span className="font-bold text-warning">
        Plus que {slot.ordersRemaining} commande{slot.ordersRemaining > 1 ? 's' : ''} possible
        {slot.ordersRemaining > 1 ? 's' : ''}
      </span>
    )
  }
  return null
}

export default async function VillagePage({ params }: Props) {
  const payload = await getPayload({ config: await config })
  const location = await getLocationBySlug(payload, (await params).slug)
  if (!location) notFound()
  const slots = await getUpcomingSlots(payload, location.id)

  return (
    <>
      <Stepper current={1} />
      <h1 className="text-3xl font-bold sm:text-4xl">{location.name}</h1>
      <p className="mt-2 flex items-start gap-2 text-lg">
        <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent" />
        <span>
          {location.address}
          {location.directions && (
            <span className="mt-1 block text-base text-muted">{location.directions}</span>
          )}
        </span>
      </p>

      <h2 className="mt-8 mb-4 text-xl font-bold">Choisissez votre passage</h2>
      {slots.length === 0 ? (
        <Notice title="Aucun passage n’est prévu prochainement dans ce village.">
          Les prochaines dates apparaîtront ici dès qu’elles seront programmées.
        </Notice>
      ) : (
        <ul className="space-y-3" role="list">
          {slots.map((slot) => {
            const content = (
              <>
                <span className="flex-1">
                  <span className="block text-xl font-bold first-letter:uppercase">
                    {formatDateKey(slot.dateKey)}
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <Clock aria-hidden="true" className="size-5 shrink-0 text-accent" />
                    De {formatTime(slot.startTime)} à {formatTime(slot.endTime)}
                  </span>
                  <span className="mt-1 block text-muted">
                    Commandes jusqu&apos;au {formatShopDateTime(slot.orderDeadline)}
                  </span>
                  {slot.publicNote && <span className="mt-1 block">{slot.publicNote}</span>}
                  <span className="mt-1 block">
                    <Availability slot={slot} />
                  </span>
                </span>
                {!slot.isFull && (
                  <ChevronRight aria-hidden="true" className="size-6 shrink-0 text-accent" />
                )}
              </>
            )
            return (
              <li key={slot.id}>
                {slot.isFull ? (
                  <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 text-ink opacity-80">
                    {content}
                  </div>
                ) : (
                  <Link
                    href={`/commander/${slot.id}`}
                    className="flex items-center gap-4 rounded-2xl border-2 border-line bg-white p-4 text-ink no-underline transition-colors hover:border-accent"
                  >
                    {content}
                    <span className="sr-only">: commander pour ce passage</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
