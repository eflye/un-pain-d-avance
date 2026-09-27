import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Précommandez votre boulangerie et choisissez votre jour de livraison.',
  title: "Un pain d'avance",
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="fr">
      <body className="bg-stone-50 text-stone-900 antialiased">
        <main>{children}</main>
      </body>
    </html>
  )
}
