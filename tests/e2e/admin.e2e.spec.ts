import { expect, test } from '@playwright/test'

import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

test.describe('Back-office', () => {
  test.beforeAll(async () => {
    await seedTestUser()
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('refuse l’accès aux visiteurs non connectés', async ({ page }) => {
    await page.goto('/admin/collections/orders')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('permet au gestionnaire de consulter les passages et les commandes', async ({ page }) => {
    await login({ page, user: testUser })
    await page.goto('/admin/collections/pickup-slots')
    await expect(page.getByRole('heading', { name: 'Passages', level: 1 })).toBeVisible()
    await expect(page.getByText('Générer des passages récurrents')).toBeVisible()
    await page.goto('/admin/collections/orders')
    await expect(page.getByRole('heading', { name: 'Commandes', level: 1 })).toBeVisible()
  })
})
