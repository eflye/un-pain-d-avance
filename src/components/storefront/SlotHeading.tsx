import { CalendarDays, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { formatDateKey, formatTime } from '@/lib/dates'

type Props = {
  locationName: string
  address: string
  dateKey: string
  startTime: string
  endTime: string
  changeHref?: string
}

/** Rappel du passage choisi : où et quand retirer la commande. */
export function SlotHeading({
  locationName,
  address,
  dateKey,
  startTime,
  endTime,
  changeHref,
}: Props) {
  return (
    <section
      aria-label="Votre passage"
      className="mb-8 rounded-2xl border border-line bg-white p-4 sm:p-5"
    >
      <ul className="space-y-2" role="list">
        <li className="flex items-start gap-3">
          <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent" />
          <span>
            <span className="block text-lg font-bold">{locationName}</span>
            <span className="text-muted">{address}</span>
          </span>
        </li>
        <li className="flex items-center gap-3">
          <CalendarDays aria-hidden="true" className="size-5 shrink-0 text-accent" />
          <span className="font-bold first-letter:uppercase">{formatDateKey(dateKey)}</span>
        </li>
        <li className="flex items-center gap-3">
          <Clock aria-hidden="true" className="size-5 shrink-0 text-accent" />
          <span>
            De {formatTime(startTime)} à {formatTime(endTime)}
          </span>
        </li>
      </ul>
      {changeHref && (
        <Link href={changeHref} className="mt-3 inline-block font-bold text-accent underline">
          Changer de passage
        </Link>
      )}
    </section>
  )
}
