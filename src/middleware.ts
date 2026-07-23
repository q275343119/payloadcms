import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { isLocale } from '@/lib/locales'

const PASSTHROUGH_PREFIXES = ['/admin', '/api', '/_next']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname === '/' ||
    pathname === '/favicon.ico' ||
    PASSTHROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next()
  }

  const locale = pathname.split('/')[1]
  if (!isLocale(locale)) {
    return new NextResponse('Not Found', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
      status: 404,
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
