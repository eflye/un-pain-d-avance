import { createHmac, timingSafeEqual } from 'crypto'

// Lien d'accès d'un client à sa commande : la référence seule est devinable,
// on l'accompagne d'une signature HMAC dérivée du secret Payload.

function signature(reference: string): string {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET manquant.')
  return createHmac('sha256', secret).update(`order:${reference}`).digest('base64url').slice(0, 32)
}

export function signOrderReference(reference: string): string {
  return signature(reference)
}

export function verifyOrderSignature(reference: string, candidate: string | undefined): boolean {
  if (!candidate) return false
  const expected = Buffer.from(signature(reference))
  const received = Buffer.from(candidate)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

/** Chemin de la page de suivi d'une commande. */
export function orderPath(reference: string): string {
  return `/commande/${encodeURIComponent(reference)}?cle=${signOrderReference(reference)}`
}
