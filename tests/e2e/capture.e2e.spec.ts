import { expect, test } from '@playwright/test'

/**
 * Captures d'écran pour la revue de design, sur les données de démonstration (npm run seed:demo).
 * Ignoré par défaut : CAPTURE=1 podman compose --profile e2e run --rm e2e npx playwright test capture
 */
test.skip(!process.env.CAPTURE, 'Captures uniquement sur demande (CAPTURE=1).')

test('captures du parcours', async ({ page }, testInfo) => {
  const shot = (name: string) =>
    page.screenshot({
      path: `.impeccable/review/${testInfo.project.name}-${name}.png`,
      fullPage: true,
    })

  await page.goto('/')
  await shot('accueil')
  await page.goto('/village/montgeroult')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await shot('village')
  await page
    .getByRole('link', { name: /Commander pour ce passage/ })
    .first()
    .click()
  await expect(page.getByRole('heading', { level: 1, name: 'Vos produits' })).toBeVisible()
  await page.getByRole('button', { name: /Augmenter la quantité de Baguette/ }).click()
  await page.getByRole('button', { name: /Augmenter la quantité de Croissant/ }).click()
  await shot('produits')
  await page.getByRole('link', { name: 'Continuer' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Vos coordonnées' })).toBeVisible()
  await page.getByRole('button', { name: /Payer/ }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Certains champs' })).toBeVisible()
  await shot('coordonnees-erreurs')
  await page.getByLabel('Prénom').fill('Camille')
  await page.getByLabel('Nom', { exact: true }).fill('Démo')
  await page.getByLabel('Adresse e-mail').fill('camille.demo@example.com')
  await page.getByLabel('Téléphone').fill('06 12 34 56 78')
  await page.getByLabel(/J'accepte les/).check()
  await page.getByRole('button', { name: /Payer/ }).click()
  await expect(page).toHaveURL(/paiement-simule/)
  await shot('paiement')
  await page.getByRole('button', { name: 'Simuler un paiement réussi' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Commande confirmée' })).toBeVisible()
  await shot('confirmation')
  await page.goto('/cgv')
  await shot('cgv')
  await page.goto('/village/nexiste-pas')
  await shot('introuvable')
})
