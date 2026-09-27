'use client'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { useCart } from './cart'

/** « Continuer » vers les coordonnées, inactif tant que le panier est vide. */
export function ContinueButton({ href }: { href: string }) {
  const { itemCount } = useCart()
  if (itemCount === 0) {
    return (
      <span className="btn-primary" aria-disabled="true">
        Continuer
      </span>
    )
  }
  return (
    <Link href={href} className="btn-primary">
      Continuer
      <ArrowRight aria-hidden="true" className="size-5" />
    </Link>
  )
}
