import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import React from 'react'

const TONES = {
  info: { icon: Info, className: 'border-line bg-white text-ink' },
  success: { icon: CheckCircle2, className: 'border-success/30 bg-success-soft text-success' },
  warning: { icon: AlertTriangle, className: 'border-warning/30 bg-warning-soft text-warning' },
  danger: { icon: XCircle, className: 'border-danger/30 bg-danger-soft text-danger' },
} as const

/** Message d'état : icône + texte, jamais la couleur seule. */
export function Notice({
  tone = 'info',
  title,
  children,
  role,
}: {
  tone?: keyof typeof TONES
  title: string
  children?: React.ReactNode
  role?: 'alert' | 'status'
}) {
  const { icon: Icon, className } = TONES[tone]
  return (
    <div role={role} className={`flex gap-3 rounded-2xl border p-4 ${className}`}>
      <Icon aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
      <div>
        <p className="font-bold">{title}</p>
        {children && <div className="mt-1 text-ink">{children}</div>}
      </div>
    </div>
  )
}
