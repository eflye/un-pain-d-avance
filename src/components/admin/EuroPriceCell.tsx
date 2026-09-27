import type { DefaultCellComponentProps } from 'payload'

import { formatCents } from '@/lib/money'

// Affiche un montant en centimes sous la forme « 2,50 € » dans les listes de l'admin.
export const EuroPriceCell = ({ cellData }: DefaultCellComponentProps) =>
  typeof cellData === 'number' ? formatCents(cellData) : null
