import Link from 'next/link'
import React from 'react'

export default function NotFound() {
  return (
    <>
      <h1 className="mb-4 text-3xl font-bold">Page introuvable</h1>
      <p className="text-lg text-muted">
        Ce lien n&apos;existe pas ou n&apos;est plus valable. Si vous cherchez votre commande,
        utilisez le lien reçu par e-mail.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Retour à l&apos;accueil
      </Link>
    </>
  )
}
