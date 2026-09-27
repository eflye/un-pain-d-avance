'use server'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@/payload.config'
import {
  createPendingOrder,
  type OrderInputError,
  OrderRejectedError,
  parseNewOrderInput,
} from '@/services/orders'
import { startPayment } from '@/services/payments'

export type CheckoutState = {
  fieldErrors: Partial<Record<OrderInputError['field'], string>>
  /** Refus métier (passage complet, stock épuisé…) ou erreur technique, affichés en tête de formulaire. */
  formErrors: string[]
  values: Record<string, string>
}

/** Valide la commande côté serveur, la crée en attente de paiement, puis redirige vers le paiement. */
export async function placeOrder(
  _previous: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const values = {
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    customerNote: String(formData.get('customerNote') ?? ''),
    termsAccepted: formData.get('termsAccepted') === 'on' ? 'on' : '',
  }
  let items: unknown = []
  try {
    items = JSON.parse(String(formData.get('items') ?? '[]'))
  } catch {
    items = []
  }

  const input = parseNewOrderInput({
    pickupSlot: formData.get('pickupSlot'),
    items,
    customer: values,
    customerNote: values.customerNote,
    termsAccepted: formData.get('termsAccepted') === 'on',
  })
  if (Array.isArray(input)) {
    return {
      values,
      formErrors: [],
      fieldErrors: Object.fromEntries(input.map((error) => [error.field, error.message])),
    }
  }

  let paymentUrl: string
  try {
    const payload = await getPayload({ config: await config })
    const order = await createPendingOrder(payload, input)
    paymentUrl = await startPayment(order)
  } catch (error) {
    if (error instanceof OrderRejectedError) {
      return { values, fieldErrors: {}, formErrors: error.reasons }
    }
    console.error('placeOrder: échec de la prise de commande', (error as Error).message)
    return {
      values,
      fieldErrors: {},
      formErrors: [
        error instanceof Error && error.message.startsWith('Le paiement en ligne')
          ? error.message
          : 'Une erreur est survenue. Votre commande n’a pas été enregistrée ; réessayez dans un instant.',
      ],
    }
  }
  redirect(paymentUrl)
}
