import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { getLocaleFromAcceptLanguage } from '@/lib/locales'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const requestHeaders = await headers()
  redirect(`/${getLocaleFromAcceptLanguage(requestHeaders.get('accept-language'))}`)
}
