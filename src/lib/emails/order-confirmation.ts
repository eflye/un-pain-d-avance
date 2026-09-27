import { formatDateKey, formatTime } from '@/lib/dates'
import { formatCents } from '@/lib/money'

export type OrderConfirmationData = {
  shopName: string
  reference: string
  firstName: string
  items: { productName: string; quantity: number; lineTotalCents: number }[]
  totalCents: number
  locationName: string
  address: string
  directions?: string | null
  dateKey: string
  startTime: string
  endTime: string
  orderUrl: string
  contactEmail?: string | null
  contactPhone?: string | null
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** E-mail envoyé quand le paiement d'une commande est confirmé (texte + HTML simple). */
export function buildOrderConfirmationEmail(data: OrderConfirmationData) {
  const day = formatDateKey(data.dateKey)
  const slot = `${day}, de ${formatTime(data.startTime)} à ${formatTime(data.endTime)}`
  const where = `${data.locationName} — ${data.address}`
  const contact = [data.contactPhone, data.contactEmail].filter(Boolean).join(' · ')
  const subject = `Commande ${data.reference} confirmée — retrait ${day}`

  const text = [
    `Bonjour ${data.firstName},`,
    '',
    'Votre commande est payée et confirmée.',
    '',
    `Référence à présenter au retrait : ${data.reference}`,
    `Où : ${where}`,
    ...(data.directions ? [data.directions] : []),
    `Quand : ${slot}`,
    '',
    ...data.items.map(
      (item) => `- ${item.productName} × ${item.quantity} : ${formatCents(item.lineTotalCents)}`,
    ),
    `Total payé : ${formatCents(data.totalCents)}`,
    '',
    `Suivre votre commande : ${data.orderUrl}`,
    ...(contact ? ['', `Une question ? ${contact}`] : []),
    '',
    data.shopName,
  ].join('\n')

  const rows = data.items
    .map(
      (item) =>
        `<tr><td style="padding:6px 0">${escapeHtml(item.productName)}</td>` +
        `<td style="padding:6px 8px;color:#57534e;white-space:nowrap">× ${item.quantity}</td>` +
        `<td style="padding:6px 0;text-align:right;white-space:nowrap">${formatCents(item.lineTotalCents)}</td></tr>`,
    )
    .join('')

  const html = `<!doctype html>
<html lang="fr"><body style="margin:0;background:#fafaf9;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5;color:#1c1917">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="margin:-24px -16px 24px;padding:16px;background:#a9d4c4;border-bottom:4px solid #2f5a48;color:#3d4d58;font-family:Georgia,serif;font-size:22px">${escapeHtml(data.shopName)}<div style="font-size:15px">Boulangerie · Pâtisserie</div></div>
<p>Bonjour ${escapeHtml(data.firstName)},</p>
<p>Votre commande est <strong>payée et confirmée</strong>.</p>
<div style="margin:24px 0;padding:16px;border:2px solid #1c1917;border-radius:12px;background:#fff;text-align:center">
<div style="color:#57534e">Référence à présenter au retrait</div>
<div style="font-size:32px;font-weight:bold;letter-spacing:2px">${escapeHtml(data.reference)}</div>
</div>
<p style="margin:0"><strong>Où :</strong> ${escapeHtml(where)}</p>
${data.directions ? `<p style="margin:0;color:#57534e">${escapeHtml(data.directions)}</p>` : ''}
<p style="margin:8px 0 24px"><strong>Quand :</strong> ${escapeHtml(slot)}</p>
<table role="presentation" style="width:100%;border-collapse:collapse">${rows}
<tr><td colspan="2" style="padding-top:12px;font-weight:bold">Total payé</td>
<td style="padding-top:12px;text-align:right;font-weight:bold;white-space:nowrap">${formatCents(data.totalCents)}</td></tr>
</table>
<p style="margin:24px 0"><a href="${escapeHtml(data.orderUrl)}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#2f5a48;color:#fff;font-weight:bold;text-decoration:none">Suivre ma commande</a></p>
${contact ? `<p style="color:#57534e">Une question ? ${escapeHtml(contact)}</p>` : ''}
<p style="color:#57534e">${escapeHtml(data.shopName)}</p>
</div></body></html>`

  return { subject, text, html }
}
