import { ChevronRight, MapPin } from 'lucide-react'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { Notice } from '@/components/storefront/Notice'
import { formatDateKey } from '@/lib/dates'
import config from '@/payload.config'
import { getActiveLocations, getUpcomingSlots } from '@/services/storefront'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config: await config })
  const locations = await getActiveLocations(payload)
  const villages = await Promise.all(
    locations.map(async (location) => ({
      location,
      next: (await getUpcomingSlots(payload, location.id, new Date(), 1))[0],
    })),
  )

  return (
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Commandez votre pain à l&apos;avance</h1>
      <p className="mt-3 text-lg text-muted">
        Choisissez votre village, puis le passage du boulanger. Vous payez en ligne et récupérez
        votre commande sur place.
      </p>

      <h2 className="mt-10 mb-4 text-xl font-bold">Votre village</h2>
      {villages.length === 0 ? (
        <Notice title="Aucune tournée n’est programmée pour le moment.">
          Revenez bientôt : les prochains passages seront affichés ici.
        </Notice>
      ) : (
        <ul
          className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white"
          role="list"
        >
          {villages.map(({ location, next }) => (
            <li key={location.id}>
              <Link
                href={`/village/${location.slug}`}
                className="flex min-h-16 items-center gap-4 px-4 py-4 text-ink no-underline hover:bg-surface"
              >
                <MapPin aria-hidden="true" className="size-6 shrink-0 text-accent" />
                <span className="flex-1">
                  <span className="block text-lg font-bold">{location.name}</span>
                  <span className="text-muted">
                    {next ? (
                      <>
                        Prochain passage :{' '}
                        <span className="text-ink">{formatDateKey(next.dateKey)}</span>
                      </>
                    ) : (
                      'Pas de passage prévu prochainement'
                    )}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="size-6 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
