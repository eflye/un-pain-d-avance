import { ALLERGENS } from '@/fields/allergens'

const LABELS = new Map<string, string>(ALLERGENS.map((a) => [a.value, a.label.toLowerCase()]))

/** « Allergènes : gluten, lait » ou mention explicite d'absence. */
export function allergensText(values: string[]): string {
  if (values.length === 0) return 'Aucun allergène déclaré'
  return `Allergènes : ${values.map((v) => LABELS.get(v) ?? v).join(', ')}`
}
