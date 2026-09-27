'use client'
import { Check } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

import { formatCents } from '@/lib/money'
import type { CatalogSection } from '@/services/storefront'

import { allergensText } from './allergens'
import { useCart } from './cart'
import { QuantityStepper } from './QuantityStepper'

/** Catalogue du passage, par catégorie, avec prix, allergènes, stock restant et quantités. */
export function CatalogList({ sections }: { sections: CatalogSection[] }) {
  const { quantities, setQuantity, hydrated } = useCart()

  return (
    <div className="space-y-10">
      {sections.map(({ category, items }) => (
        <section key={category.id} aria-labelledby={`categorie-${category.id}`}>
          <h2 id={`categorie-${category.id}`} className="mb-3 text-2xl font-bold">
            {category.name}
          </h2>
          <ul
            className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white"
            role="list"
          >
            {items.map((item) => {
              const quantity = quantities[item.id] ?? 0
              const soldOut = item.remaining === 0
              return (
                <li
                  key={item.id}
                  className={`flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center ${quantity > 0 ? 'bg-accent-soft' : ''}`}
                >
                  <div className="flex flex-1 gap-4">
                    {item.image && (
                      <Image
                        src={item.image.url}
                        alt={item.image.alt}
                        width={80}
                        height={80}
                        className="size-20 shrink-0 rounded-xl object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">
                        {item.name}
                        {item.unitLabel && (
                          <span className="font-normal text-muted"> · {item.unitLabel}</span>
                        )}
                      </h3>
                      <p className="text-lg font-bold tabular-nums">
                        {formatCents(item.priceCents)}
                      </p>
                      {item.description && <p className="mt-1 text-muted">{item.description}</p>}
                      <p className="mt-1 text-muted">{allergensText(item.allergens)}</p>
                      {quantity > 0 && (
                        <p className="mt-1 flex items-center gap-1.5 font-bold text-accent">
                          <Check aria-hidden="true" className="size-5" strokeWidth={3} />
                          Dans votre panier : {quantity}
                        </p>
                      )}
                      {soldOut ? (
                        <p className="mt-1 font-bold text-danger">Épuisé pour ce passage</p>
                      ) : (
                        item.remaining !== null &&
                        item.remaining <= 10 && (
                          <p className="mt-1 font-bold text-warning">
                            Plus que {item.remaining} disponible{item.remaining > 1 ? 's' : ''}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                  {!soldOut && (
                    <QuantityStepper
                      productName={item.name}
                      quantity={quantity}
                      max={item.remaining}
                      onChange={(next) => setQuantity(item.id, next)}
                      disabled={!hydrated}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
