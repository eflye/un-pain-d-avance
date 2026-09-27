import { Atkinson_Hyperlegible_Next, Marcellus } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import { getShopSettings } from '@/services/storefront'

import logo from '../../../public/brand/logo-ardoise.png'
import './styles.css'

// Police conçue pour la basse vision : lettres bien différenciées, grand œil.
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-atkinson',
  display: 'swap',
})

// Romain à empattements évasés, proche du lettrage peint de la devanture.
const marcellus = Marcellus({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-marcellus',
  display: 'swap',
})

export const metadata = {
  title: {
    default: "La Mie Deininge · Un pain d'avance",
    template: '%s · La Mie Deininge',
  },
  description:
    'Commandez et payez à l’avance votre pain et vos pâtisseries La Mie Deininge, retirez-les au passage du camion dans votre village.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getShopSettings(await getPayload({ config: await config }))
  return (
    <html lang="fr" className={`${atkinson.variable} ${marcellus.variable}`}>
      <body className="flex min-h-dvh flex-col bg-surface text-ink antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-bold"
        >
          Aller au contenu
        </a>
        <header className="border-b-4 border-accent bg-shopfront">
          <div className="mx-auto max-w-2xl px-4 py-4">
            <Link href="/" className="inline-block text-lettering no-underline">
              <Image src={logo} alt="La Mie Deininge" priority className="h-9 w-auto sm:h-11" />
              <span className="mt-1 block font-display text-base tracking-wide">
                Un pain d&apos;avance · commandez, retirez au camion
              </span>
            </Link>
          </div>
        </header>
        <main id="contenu" className="mx-auto w-full max-w-2xl flex-1 px-4 pt-6 pb-12">
          {children}
        </main>
        <footer className="border-t border-line bg-white">
          <div className="mx-auto max-w-2xl space-y-2 px-4 py-6 text-muted">
            <p>
              <span className="font-bold text-ink">{settings.shopName}</span>
              {settings.contactPhone && (
                <>
                  {' · '}
                  <a
                    href={`tel:${settings.contactPhone.replace(/\s/g, '')}`}
                    className="text-muted underline"
                  >
                    {settings.contactPhone}
                  </a>
                </>
              )}
              {settings.contactEmail && (
                <>
                  {' · '}
                  <a href={`mailto:${settings.contactEmail}`} className="text-muted underline">
                    {settings.contactEmail}
                  </a>
                </>
              )}
            </p>
            <Link href="/cgv" className="inline-block text-muted underline">
              Conditions générales de vente
            </Link>
          </div>
        </footer>
      </body>
    </html>
  )
}
