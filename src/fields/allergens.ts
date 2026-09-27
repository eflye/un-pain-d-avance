// Les 14 allergènes à déclaration obligatoire (règlement UE 1169/2011, annexe II).
export const ALLERGENS = [
  { label: 'Céréales contenant du gluten', value: 'gluten' },
  { label: 'Crustacés', value: 'crustaces' },
  { label: 'Œufs', value: 'oeufs' },
  { label: 'Poissons', value: 'poissons' },
  { label: 'Arachides', value: 'arachides' },
  { label: 'Soja', value: 'soja' },
  { label: 'Lait', value: 'lait' },
  { label: 'Fruits à coque', value: 'fruits_a_coque' },
  { label: 'Céleri', value: 'celeri' },
  { label: 'Moutarde', value: 'moutarde' },
  { label: 'Graines de sésame', value: 'sesame' },
  { label: 'Anhydride sulfureux et sulfites', value: 'sulfites' },
  { label: 'Lupin', value: 'lupin' },
  { label: 'Mollusques', value: 'mollusques' },
] as const

export type Allergen = (typeof ALLERGENS)[number]['value']
