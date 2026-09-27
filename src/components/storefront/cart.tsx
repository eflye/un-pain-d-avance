'use client'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import type { CatalogItem } from '@/services/storefront'

// Panier d'un passage, côté navigateur. Simple commodité : le serveur recalcule tout
// (prix, disponibilités) au moment de passer la commande.

type Quantities = Record<number, number>

type CartContextValue = {
  slotId: number
  products: Map<number, CatalogItem>
  quantities: Quantities
  setQuantity: (productId: number, quantity: number) => void
  clear: () => void
  lines: { item: CatalogItem; quantity: number; lineTotalCents: number }[]
  itemCount: number
  totalCents: number
  /** false tant que le panier n'a pas été relu depuis le stockage du navigateur. */
  hydrated: boolean
}

const CartContext = createContext<CartContextValue | null>(null)

export const cartStorageKey = (slotId: number) => `un-pain-d-avance:panier:${slotId}`

function readStoredCart(slotId: number): Quantities {
  try {
    const raw = window.sessionStorage.getItem(cartStorageKey(slotId))
    return raw ? (JSON.parse(raw) as Quantities) : {}
  } catch {
    return {}
  }
}

export function CartProvider({
  slotId,
  catalog,
  children,
}: {
  slotId: number
  catalog: CatalogItem[]
  children: React.ReactNode
}) {
  const products = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog])
  const [quantities, setQuantities] = useState<Quantities>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Relecture après montage : le stockage n'existe pas au rendu serveur.
    const stored = readStoredCart(slotId)
    const valid: Quantities = {}
    for (const [id, qty] of Object.entries(stored)) {
      const item = products.get(Number(id))
      if (item && qty > 0)
        valid[item.id] = item.remaining === null ? qty : Math.min(qty, item.remaining)
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation unique avec le stockage navigateur
    setQuantities(valid)
    setHydrated(true)
  }, [slotId, products])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.sessionStorage.setItem(cartStorageKey(slotId), JSON.stringify(quantities))
    } catch {
      // Stockage indisponible (navigation privée) : le panier reste en mémoire.
    }
  }, [quantities, hydrated, slotId])

  const setQuantity = useCallback(
    (productId: number, quantity: number) => {
      const item = products.get(productId)
      if (!item) return
      const max = item.remaining ?? 50
      const next = Math.max(0, Math.min(quantity, max))
      setQuantities((current) => {
        const copy = { ...current }
        if (next === 0) delete copy[productId]
        else copy[productId] = next
        return copy
      })
    },
    [products],
  )

  const value = useMemo<CartContextValue>(() => {
    const lines = Object.entries(quantities)
      .map(([id, quantity]) => {
        const item = products.get(Number(id))!
        return { item, quantity, lineTotalCents: item.priceCents * quantity }
      })
      .filter((line) => line.item)
    return {
      slotId,
      products,
      quantities,
      setQuantity,
      clear: () => setQuantities({}),
      lines,
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      totalCents: lines.reduce((sum, l) => sum + l.lineTotalCents, 0),
      hydrated,
    }
  }, [quantities, products, setQuantity, slotId, hydrated])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart doit être utilisé dans un CartProvider.')
  return context
}

/** Vide le panier d'un passage (après une commande payée). */
export function ClearStoredCart({ slotId }: { slotId: number }) {
  useEffect(() => {
    try {
      window.sessionStorage.removeItem(cartStorageKey(slotId))
    } catch {
      // rien à faire
    }
  }, [slotId])
  return null
}
