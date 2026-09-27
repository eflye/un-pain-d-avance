import Link from 'next/link'
import React from 'react'

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-amber-900 sm:text-5xl">
        Un pain d&apos;avance
      </h1>
      <p className="text-lg text-stone-600">
        Précommandez votre boulangerie et choisissez votre jour de livraison.
      </p>
      <Link
        className="rounded-full bg-amber-800 px-6 py-3 font-medium text-white hover:bg-amber-900"
        href="/admin"
      >
        Back-office
      </Link>
    </div>
  )
}
