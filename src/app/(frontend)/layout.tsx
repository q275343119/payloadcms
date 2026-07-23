import type { Metadata } from 'next'
import { Newsreader, Noto_Sans_SC } from 'next/font/google'
import React from 'react'

import { isLocale } from '@/lib/locales'

import './styles.css'

const displayFont = Newsreader({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-display',
})

const sansFont = Noto_Sans_SC({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  description: 'Independent writing in English and Chinese.',
  title: {
    default: 'Journal',
    template: '%s | Journal',
  },
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale?: string }>
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params

  return (
    <html
      className={`${displayFont.variable} ${sansFont.variable}`}
      lang={isLocale(locale) ? locale : 'en'}
    >
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
