'use client'
import { TextInput, useField } from '@payloadcms/ui'
import type { NumberFieldClientComponent } from 'payload'
import React, { useState } from 'react'

import { centsToEuroInput, parseEurosToCents } from '@/lib/money'

// Champ « prix » de l'admin : saisie en euros (« 2,50 »), valeur stockée en centimes.
export const EuroPriceField: NumberFieldClientComponent = ({ field, path }) => {
  const { value, setValue, showError } = useField<number | null>({ path })
  const [draft, setDraft] = useState<string | null>(null)

  // La saisie en cours est conservée tant qu'elle correspond à la valeur du formulaire ;
  // sinon (chargement du document, reset) on affiche la valeur stockée.
  const fromValue = typeof value === 'number' ? centsToEuroInput(value) : ''
  const text = draft !== null && parseEurosToCents(draft) === (value ?? null) ? draft : fromValue

  const invalid = text.trim() !== '' && parseEurosToCents(text) === null

  return (
    <TextInput
      AfterInput={
        invalid ? (
          <p role="alert" style={{ color: 'var(--theme-error-500)', marginTop: 4 }}>
            Montant invalide. Format attendu : 2,50
          </p>
        ) : null
      }
      description={field.admin?.description}
      label={field.label || undefined}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        setDraft(e.target.value)
        setValue(parseEurosToCents(e.target.value))
      }}
      path={path}
      placeholder="0,00"
      required={field.required}
      showError={showError}
      value={text}
    />
  )
}
