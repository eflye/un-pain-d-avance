import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config'
import { createPendingOrder } from '../../src/services/orders'
import { createShopFixtures, testCustomer } from '../helpers/shopFixtures'

let payload: Payload
let shop: Awaited<ReturnType<typeof createShopFixtures>>

/** Contrôle RGAA automatisable : aucune violation WCAG 2.1 A/AA détectée par axe. */
async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(
    violations.map((v) => `${v.id} (${v.impact}) : ${v.nodes.map((n) => n.target).join(' | ')}`),
  ).toEqual([])
}

test.describe('Parcours client', () => {
  test.beforeAll(async ({}, testInfo) => {
    payload = await getPayload({ config: await config })
    shop = await createShopFixtures(payload, `e2e ${testInfo.project.name}`)
  })

  test.afterAll(async () => {
    await shop.cleanup()
  })

  test('commande, paie et obtient sa référence de retrait', async ({ page }) => {
    await shop.createSlot()

    await page.goto(`/village/${shop.location.slug}`)
    await expect(page.getByRole('heading', { level: 1, name: shop.location.name })).toBeVisible()
    await expectAccessible(page)

    await page
      .getByRole('link', { name: /Commander pour ce passage/ })
      .first()
      .click()
    await expect(page.getByRole('heading', { level: 1, name: 'Vos produits' })).toBeVisible()
    await expectAccessible(page)

    const increase = (name: string) =>
      page.getByRole('button', { name: `Augmenter la quantité de ${name}` })
    await increase(shop.baguette.name).click()
    await increase(shop.baguette.name).click()
    await increase(shop.croissant.name).click()
    await expect(page.getByText('3 articles')).toBeVisible()
    await expect(page.getByText(/^3,55\s€$/).first()).toBeVisible()

    await page.getByRole('link', { name: 'Continuer' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Vos coordonnées' })).toBeVisible()
    await expectAccessible(page)

    // Envoi incomplet : erreurs annoncées et reliées aux champs.
    await page.getByRole('button', { name: /Payer/ }).click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Certains champs sont à corriger' }),
    ).toBeVisible()
    await expect(page.getByLabel('Prénom')).toHaveAttribute('aria-invalid', 'true')
    await expectAccessible(page)

    await page.getByLabel('Prénom').fill(testCustomer.firstName)
    await page.getByLabel('Nom', { exact: true }).fill(testCustomer.lastName)
    await page.getByLabel('Adresse e-mail').fill(testCustomer.email)
    await page.getByLabel('Téléphone').fill(testCustomer.phone)
    await page.getByLabel(/J'accepte les/).check()
    await page.getByRole('button', { name: /Payer 3,55/ }).click()

    await expect(page).toHaveURL(/\/paiement-simule\//)
    await expectAccessible(page)
    await page.getByRole('button', { name: 'Simuler un paiement réussi' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Commande confirmée' })).toBeVisible()
    const reference = (await page.getByText(/^PA-[A-Z2-9]{5}$/).textContent())!.trim()
    await expectAccessible(page)

    const { docs } = await payload.find({
      collection: 'orders',
      where: { reference: { equals: reference } },
    })
    expect(docs[0]).toMatchObject({ status: 'payee', totalCents: 355 })
  })

  test('l’abandon du paiement annule la commande', async ({ page }) => {
    const slot = await shop.createSlot()
    const order = await createPendingOrder(payload, {
      pickupSlot: slot.id,
      items: [{ productId: shop.baguette.id, quantity: 1 }],
      customer: testCustomer,
      termsAccepted: true,
    })
    const { signOrderReference } = await import('../../src/lib/order-access')
    await page.goto(
      `/paiement-simule/${order.reference}?cle=${signOrderReference(order.reference!)}`,
    )
    await page.getByRole('button', { name: 'Simuler un abandon' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Commande annulée' })).toBeVisible()
    await expect(page.getByText('Aucun montant n’a été débité.')).toBeVisible()
  })

  test('un passage complet n’est plus commandable', async ({ page }) => {
    const slot = await shop.createSlot({ maxOrders: 1, publicNote: 'Passage presque plein' })
    await createPendingOrder(payload, {
      pickupSlot: slot.id,
      items: [{ productId: shop.baguette.id, quantity: 1 }],
      customer: testCustomer,
      termsAccepted: true,
    })

    await page.goto(`/village/${shop.location.slug}`)
    const fullSlot = page.getByRole('listitem').filter({ hasText: 'Passage presque plein' })
    await expect(fullSlot.getByText('Complet')).toBeVisible()
    await expect(fullSlot.getByRole('link')).toHaveCount(0)

    await page.goto(`/commander/${slot.id}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Commande impossible' })).toBeVisible()
  })

  test('une commande n’est pas consultable sans son lien signé', async ({ page }) => {
    const slot = await shop.createSlot()
    const order = await createPendingOrder(payload, {
      pickupSlot: slot.id,
      items: [{ productId: shop.baguette.id, quantity: 1 }],
      customer: testCustomer,
      termsAccepted: true,
    })
    const response = await page.goto(`/commande/${order.reference}?cle=devinette`)
    expect(response?.status()).toBe(404)
    await expect(page.getByText(testCustomer.lastName)).toHaveCount(0)
  })

  test('l’accueil liste les villages et reste accessible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: new RegExp(shop.location.name) })).toBeVisible()
    await expectAccessible(page)
  })
})
