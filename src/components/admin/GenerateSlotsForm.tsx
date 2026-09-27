'use client'
import { Button, useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { useEffect, useId, useState } from 'react'

const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

type LocationOption = { id: number; name: string }

const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 }
const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 'var(--style-radius-s)',
  background: 'var(--theme-input-bg)',
  color: 'var(--theme-text)',
  font: 'inherit',
}

// Formulaire affiché au-dessus de la liste des passages : création en série des passages récurrents.
export const GenerateSlotsForm: React.FC = () => {
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const router = useRouter()
  const id = useId()
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  useEffect(() => {
    fetch(`${serverURL}${api}/locations?where[active][equals]=true&limit=200&depth=0&sort=_order`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: { docs?: LocationOption[] }) => setLocations(data.docs ?? []))
      .catch(() => setLocations([]))
  }, [api, serverURL])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage(null)
    const body = Object.fromEntries(new FormData(event.currentTarget))
    try {
      const res = await fetch(`${serverURL}${api}/pickup-slots/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { created?: string[]; skipped?: string[]; error?: string }
      if (!res.ok) {
        setMessage({ kind: 'error', text: data.error ?? 'La génération a échoué.' })
        return
      }
      const created = data.created?.length ?? 0
      const skipped = data.skipped?.length ?? 0
      setMessage({
        kind: 'success',
        text:
          `${created} passage${created > 1 ? 's' : ''} créé${created > 1 ? 's' : ''}` +
          (skipped
            ? `, ${skipped} date${skipped > 1 ? 's' : ''} déjà couverte${skipped > 1 ? 's' : ''}.`
            : '.'),
      })
      router.refresh()
    } catch {
      setMessage({ kind: 'error', text: 'Erreur réseau, réessayez.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <details
      style={{
        margin: '0 0 24px',
        padding: '12px 16px',
        border: '1px solid var(--theme-elevation-100)',
        borderRadius: 'var(--style-radius-m)',
      }}
    >
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
        Générer des passages récurrents
      </summary>
      <form onSubmit={onSubmit} style={{ marginTop: 16, display: 'grid', gap: 16 }}>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          }}
        >
          <div style={fieldStyle}>
            <label htmlFor={`${id}-location`}>Lieu *</label>
            <select
              id={`${id}-location`}
              name="location"
              required
              style={inputStyle}
              defaultValue=""
            >
              <option value="" disabled>
                Choisir…
              </option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <div style={fieldStyle}>
            <label htmlFor={`${id}-weekday`}>Jour *</label>
            <select
              id={`${id}-weekday`}
              name="weekday"
              required
              style={inputStyle}
              defaultValue="6"
            >
              {WEEKDAYS.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div style={fieldStyle}>
            <label htmlFor={`${id}-start`}>Début *</label>
            <input id={`${id}-start`} name="startTime" type="time" required style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label htmlFor={`${id}-end`}>Fin *</label>
            <input id={`${id}-end`} name="endTime" type="time" required style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label htmlFor={`${id}-from`}>Du *</label>
            <input id={`${id}-from`} name="from" type="date" required style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label htmlFor={`${id}-to`}>Au *</label>
            <input id={`${id}-to`} name="to" type="date" required style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label htmlFor={`${id}-max`}>Commandes max.</label>
            <input
              id={`${id}-max`}
              name="maxOrders"
              type="number"
              min={1}
              step={1}
              style={inputStyle}
            />
          </div>
        </div>
        <p style={{ margin: 0, color: 'var(--theme-elevation-500)' }}>
          La date limite de chaque passage suit la règle des réglages boutique. Les dates déjà
          couvertes pour ce lieu sont ignorées.
        </p>
        <div aria-live="polite" role="status">
          {message && (
            <p
              style={{
                margin: 0,
                color:
                  message.kind === 'error' ? 'var(--theme-error-500)' : 'var(--theme-success-500)',
              }}
            >
              {message.text}
            </p>
          )}
        </div>
        <div>
          <Button buttonStyle="primary" disabled={pending} type="submit">
            {pending ? 'Génération…' : 'Générer les passages'}
          </Button>
        </div>
      </form>
    </details>
  )
}
