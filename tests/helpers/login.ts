import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  user: {
    email: string
    password: string
  }
}

/** Connexion au back-office via la page de login (URL relative à baseURL). */
export async function login({ page, user }: LoginOptions): Promise<void> {
  await page.goto('/admin/login')
  await page.fill('#field-email', user.email)
  await page.fill('#field-password', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin$/)
  // Le tableau de bord n'a pas de titre h1 : on attend la navigation du back-office.
  await expect(page.getByRole('link', { name: 'Commandes' }).first()).toBeAttached()
}
