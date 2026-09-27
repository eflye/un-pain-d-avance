// Montants : toujours manipulés en centimes (entiers). Ces fonctions ne font que convertir
// depuis / vers la saisie et l'affichage en euros.

const EURO_INPUT = /^(\d+)(?:[.,](\d{1,2}))?$/

/** Convertit une saisie en euros (« 2,50 », « 2.5 », « 3 », « 1 200,00 € ») en centimes, ou null si invalide. */
export function parseEurosToCents(input: string): number | null {
  const normalized = input.replace(/[\s  €]/g, '')
  const match = EURO_INPUT.exec(normalized)
  if (!match) return null
  const [, euros, decimals = ''] = match
  return Number(euros) * 100 + Number(decimals.padEnd(2, '0'))
}

/** Centimes → valeur éditable dans un champ de saisie (« 2,50 »). */
export function centsToEuroInput(cents: number): string {
  const euros = Math.trunc(cents / 100)
  const rest = String(Math.abs(cents % 100)).padStart(2, '0')
  return `${euros},${rest}`
}

const euroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

/** Centimes → montant affiché (« 2,50 € »). */
export function formatCents(cents: number): string {
  return euroFormatter.format(cents / 100)
}
