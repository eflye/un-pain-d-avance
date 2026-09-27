import { Check } from 'lucide-react'
import React from 'react'

const STEPS = ['Passage', 'Produits', 'Coordonnées', 'Paiement'] as const

/** Indique l'étape en cours du parcours de commande (1 à 4). */
export function Stepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <nav aria-label="Étapes de la commande" className="mb-6">
      <p className="mb-2 font-bold text-muted">
        Étape {current} sur {STEPS.length} : {STEPS[current - 1]}
      </p>
      <ol className="grid grid-cols-4 gap-1.5" role="list">
        {STEPS.map((label, index) => {
          const step = index + 1
          const done = step < current
          const active = step === current
          return (
            <li key={label} aria-current={active ? 'step' : undefined}>
              <span
                aria-hidden="true"
                className={`block h-1.5 rounded-full ${done || active ? 'bg-accent' : 'bg-line'}`}
              />
              <span
                className={`mt-1.5 flex items-center gap-1 text-xs leading-tight whitespace-nowrap sm:text-sm ${active ? 'font-bold text-ink' : 'text-muted'}`}
              >
                {done && <Check aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={3} />}
                <span className="min-w-0">{label}</span>
                {done && <span className="sr-only"> (terminée)</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
