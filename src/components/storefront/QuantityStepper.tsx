'use client'
import { Minus, Plus } from 'lucide-react'
import React from 'react'

type Props = {
  productName: string
  quantity: number
  max: number | null
  onChange: (quantity: number) => void
  /** Désactivé tant que le panier n'est pas prêt (avant hydratation). */
  disabled?: boolean
}

const buttonClass =
  'inline-flex size-12 items-center justify-center rounded-xl border-2 border-ink bg-white text-ink transition-transform active:translate-y-px disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:active:translate-y-0'

/** Boutons − / + larges (48 px) avec la quantité annoncée aux lecteurs d'écran. */
export function QuantityStepper({ productName, quantity, max, onChange, disabled = false }: Props) {
  const atMax = max !== null && quantity >= max
  return (
    <div className="flex items-center gap-2" role="group" aria-label={`Quantité de ${productName}`}>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(quantity - 1)}
        disabled={disabled || quantity === 0}
        aria-label={`Diminuer la quantité de ${productName}`}
      >
        <Minus aria-hidden="true" className="size-5" strokeWidth={2.5} />
      </button>
      <output className="w-8 text-center text-xl font-bold" aria-live="polite">
        {quantity}
      </output>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(quantity + 1)}
        disabled={disabled || atMax}
        aria-label={`Augmenter la quantité de ${productName}`}
      >
        <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />
      </button>
    </div>
  )
}
