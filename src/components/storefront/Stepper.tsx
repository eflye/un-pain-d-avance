import { Check } from 'lucide-react'
import React from 'react'

const STEPS = ['Passage', 'Produits', 'Coordonnées', 'Paiement'] as const

/**
 * Avancement du parcours (1 à 4). Sur téléphone, les barres et « Étape n sur 4 » suffisent :
 * le titre de la page nomme déjà l'étape. Les libellés apparaissent à partir de la tablette.
 */
export function Stepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <nav
      aria-label={`Étapes de la commande : étape ${current} sur ${STEPS.length}`}
      className="mb-6"
    >
      <ol className="grid grid-cols-4 gap-1.5" role="list">
        {STEPS.map((label, index) => {
          const step = index + 1
          const done = step < current
          const active = step === current
          return (
            <li key={label} aria-current={active ? 'step' : undefined}>
              <span
                aria-hidden="true"
                className={`block h-2 rounded-full ${done || active ? 'bg-accent' : 'bg-line'}`}
              />
              <span
                className={`sr-only sm:not-sr-only sm:mt-2 sm:flex sm:items-center sm:gap-1 ${active ? 'font-bold text-ink' : 'text-muted'}`}
              >
                {done && <Check aria-hidden="true" className="size-4 shrink-0" strokeWidth={3} />}
                {label}
                {done && <span className="sr-only"> (terminée)</span>}
              </span>
            </li>
          )
        })}
      </ol>
      <p aria-hidden="true" className="mt-2 text-muted sm:hidden">
        Étape {current} sur {STEPS.length}
      </p>
    </nav>
  )
}
