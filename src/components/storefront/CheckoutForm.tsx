'use client'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import React, { useActionState, useEffect, useRef } from 'react'

import type { CheckoutState } from '@/app/(frontend)/commander/[slotId]/coordonnees/actions'
import { formatCents } from '@/lib/money'

import { useCart } from './cart'
import { Notice } from './Notice'

type Action = (state: CheckoutState, formData: FormData) => Promise<CheckoutState>

const initialState: CheckoutState = { fieldErrors: {}, formErrors: [], values: {} }

function Field({
  name,
  label,
  hint,
  error,
  defaultValue,
  ...input
}: {
  name: string
  label: string
  hint?: string
  error?: string
  defaultValue?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = [hint && `${name}-aide`, error && `${name}-erreur`].filter(Boolean).join(' ')
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block font-bold">
        {label}
      </label>
      {hint && (
        <p id={`${name}-aide`} className="mb-1.5 text-muted">
          {hint}
        </p>
      )}
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="field-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...input}
      />
      {error && (
        <p id={`${name}-erreur`} className="mt-1.5 font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/** Récapitulatif du panier + coordonnées + acceptation des CGV, puis envoi vers le paiement. */
export function CheckoutForm({ action, productsHref }: { action: Action; productsHref: string }) {
  const { slotId, lines, totalCents, hydrated } = useCart()
  const [state, formAction, pending] = useActionState(action, initialState)
  const summaryRef = useRef<HTMLDivElement>(null)
  const errorCount = Object.keys(state.fieldErrors).length + state.formErrors.length

  useEffect(() => {
    // Après un envoi refusé, amener le focus sur le résumé des erreurs.
    if (errorCount > 0) summaryRef.current?.focus()
  }, [state, errorCount])

  if (hydrated && lines.length === 0) {
    return (
      <>
        <Notice title="Votre panier est vide.">Ajoutez au moins un produit pour continuer.</Notice>
        <Link href={productsHref} className="btn-secondary mt-6">
          Choisir des produits
        </Link>
      </>
    )
  }

  const { fieldErrors, values } = state
  return (
    <form action={formAction} noValidate className="space-y-8">
      <input type="hidden" name="pickupSlot" value={slotId} />
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(lines.map((l) => ({ productId: l.item.id, quantity: l.quantity })))}
      />

      {errorCount > 0 && (
        <div ref={summaryRef} tabIndex={-1} className="outline-none">
          <Notice
            tone="danger"
            role="alert"
            title={
              state.formErrors.length > 0
                ? 'Votre commande n’a pas pu être enregistrée.'
                : 'Certains champs sont à corriger.'
            }
          >
            <ul className="list-disc pl-5">
              {state.formErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
              {Object.entries(fieldErrors).map(([field, message]) => (
                <li key={field}>
                  {field === 'items' ? (
                    message
                  ) : (
                    <a href={`#${field}`} className="underline">
                      {message}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            {state.formErrors.length > 0 && (
              <Link href={productsHref} className="mt-2 inline-block font-bold underline">
                Modifier mes produits
              </Link>
            )}
          </Notice>
        </div>
      )}

      <section aria-labelledby="recapitulatif">
        <h2 id="recapitulatif" className="mb-3 text-xl font-bold">
          Votre commande
        </h2>
        <div className="rounded-2xl border border-line bg-white p-4">
          <table className="w-full text-left tabular-nums">
            <caption className="sr-only">Produits commandés</caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Produit</th>
                <th scope="col">Quantité</th>
                <th scope="col">Montant</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(({ item, quantity, lineTotalCents }) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <th scope="row" className="py-2 pr-2 font-normal">
                    {item.name}
                  </th>
                  <td className="py-2 pr-2 whitespace-nowrap text-muted">× {quantity}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    {formatCents(lineTotalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2} className="pt-3 text-lg font-bold">
                  Total
                </th>
                <td className="pt-3 text-right text-lg font-bold whitespace-nowrap">
                  {formatCents(totalCents)}
                </td>
              </tr>
            </tfoot>
          </table>
          <Link href={productsHref} className="mt-2 inline-block font-bold text-accent underline">
            Modifier mes produits
          </Link>
        </div>
      </section>

      <fieldset className="space-y-5">
        <legend className="mb-4 text-xl font-bold">Qui vient chercher la commande ?</legend>
        <p className="-mt-2 text-muted">Tous les champs sont obligatoires, sauf le message.</p>
        <Field
          name="firstName"
          label="Prénom"
          autoComplete="given-name"
          defaultValue={values.firstName}
          error={fieldErrors.firstName}
          required
        />
        <Field
          name="lastName"
          label="Nom"
          autoComplete="family-name"
          defaultValue={values.lastName}
          error={fieldErrors.lastName}
          required
        />
        <Field
          name="email"
          label="Adresse e-mail"
          hint="Pour recevoir la confirmation de commande."
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={values.email}
          error={fieldErrors.email}
          required
        />
        <Field
          name="phone"
          label="Téléphone"
          hint="Pour vous prévenir en cas de retard de la tournée."
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={values.phone}
          error={fieldErrors.phone}
          required
        />
        <div>
          <label htmlFor="customerNote" className="mb-1.5 block font-bold">
            Message pour le boulanger (facultatif)
          </label>
          <textarea
            id="customerNote"
            name="customerNote"
            rows={3}
            maxLength={1000}
            defaultValue={values.customerNote}
            className="field-input"
          />
        </div>
      </fieldset>

      <div>
        <div className="flex items-start gap-3">
          <input
            id="termsAccepted"
            name="termsAccepted"
            type="checkbox"
            className="mt-0.5 size-7 shrink-0"
            defaultChecked={values.termsAccepted === 'on'}
            aria-invalid={fieldErrors.termsAccepted ? true : undefined}
            aria-describedby={fieldErrors.termsAccepted ? 'termsAccepted-erreur' : undefined}
            required
          />
          <label htmlFor="termsAccepted">
            J&apos;accepte les{' '}
            <Link href="/cgv" target="_blank" className="font-bold text-accent underline">
              conditions générales de vente
              <span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
            </Link>
            . Les produits alimentaires périssables ne donnent pas droit à rétractation.
          </label>
        </div>
        {fieldErrors.termsAccepted && (
          <p id="termsAccepted-erreur" className="mt-1.5 font-bold text-danger">
            {fieldErrors.termsAccepted}
          </p>
        )}
      </div>

      <button type="submit" className="btn-primary w-full text-lg" disabled={pending || !hydrated}>
        <Lock aria-hidden="true" className="size-5" />
        {pending ? 'Enregistrement…' : `Payer ${formatCents(totalCents)}`}
      </button>
    </form>
  )
}
