'use client'
import { ShoppingBasket } from 'lucide-react'
import React from 'react'

import { formatCents } from '@/lib/money'

import { useCart } from './cart'

/** Récapitulatif du panier (total, action de l'étape), collé en bas de l'écran pendant le défilement. */
export function SummaryBar({ children }: { children: React.ReactNode }) {
  const { itemCount, totalCents } = useCart()
  return (
    // Collante en bas de l'écran tant que le contenu défile, puis s'arrête avant le pied de page.
    <div className="sticky bottom-0 z-10 -mx-4 mt-10 border-t border-line bg-white/95 shadow-[0_-4px_16px_rgb(28_25_23/0.08)] backdrop-blur-sm sm:mx-0 sm:rounded-t-2xl sm:border-x">
      <div className="flex items-center gap-4 px-4 py-3">
        <p className="flex flex-1 items-center gap-2" aria-live="polite">
          <ShoppingBasket aria-hidden="true" className="size-6 shrink-0 text-accent" />
          <span>
            <span className="block text-sm text-muted">
              {itemCount === 0 ? 'Panier vide' : `${itemCount} article${itemCount > 1 ? 's' : ''}`}
            </span>
            <span className="block text-xl font-bold">{formatCents(totalCents)}</span>
          </span>
        </p>
        {children}
      </div>
    </div>
  )
}
