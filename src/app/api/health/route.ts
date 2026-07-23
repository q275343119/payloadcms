import { getPayload } from 'payload'

import config from '@/payload.config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    await payload.count({
      collection: 'posts',
      overrideAccess: true,
    })

    return Response.json(
      { status: 'ok' },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch {
    return Response.json(
      { status: 'unavailable' },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
        status: 503,
      },
    )
  }
}
