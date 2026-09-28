import { sql } from '@payloadcms/db-postgres'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/** Sonde de santé (healthcheck du container, reverse proxy) : app démarrée et base joignable. */
export async function GET() {
  try {
    const payload = await getPayload({ config: await config })
    await (payload.db as unknown as PostgresAdapter).drizzle.execute(sql`select 1`)
    return Response.json({ status: 'ok' })
  } catch {
    return Response.json({ status: 'error' }, { status: 503 })
  }
}
