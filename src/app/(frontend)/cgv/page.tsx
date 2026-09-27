import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import React from 'react'

import { Notice } from '@/components/storefront/Notice'
import config from '@/payload.config'
import { getShopSettings } from '@/services/storefront'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Conditions générales de vente' }

export default async function TermsPage() {
  const payload = await getPayload({ config: await config })
  const settings = await getShopSettings(payload)

  return (
    <>
      <h1 className="mb-6 text-3xl">Conditions générales de vente</h1>
      {settings.termsOfSale ? (
        <RichText
          data={settings.termsOfSale}
          className="max-w-[70ch] space-y-4 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
        />
      ) : (
        <Notice title="Les conditions générales de vente ne sont pas encore publiées.">
          Les produits alimentaires périssables ne donnent pas droit à rétractation.
        </Notice>
      )}
    </>
  )
}
