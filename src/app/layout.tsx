import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display, Dancing_Script } from 'next/font/google'
import Navigation from '@/components/Navigation'
import Background from '@/components/Background'
import { ThemeProvider } from '@/components/ThemeProvider'
import ThemeToggle from '@/components/ThemeToggle'
import SiteEffects from '@/components/effects/SiteEffects'
import { Toaster } from '@/components/effects/Toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' })
const dancingScript = Dancing_Script({ subsets: ['latin'], variable: '--font-dancing', display: 'swap' })

const DESCRIPTION = 'Letters, memories, little games and five beautiful years of us, made with love just for you.'

export const metadata: Metadata = {
  title: {
    default: '5 Years & Happy Birthday · Our Little World',
    template: '%s · Our Little World',
  },
  description: DESCRIPTION,
  applicationName: 'Our Little World',
  // A private love letter of a website: keep it out of search engines.
  robots: { index: false, follow: false },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    title: 'Our Little World',
    description: DESCRIPTION,
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Updated on the client to match the chosen theme (see ThemeProvider).
  themeColor: '#fdfbf7',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${dancingScript.variable}`}
    >
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:rounded-full focus:bg-rose-500 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg dark:focus:bg-purple-500"
          >
            Skip to content
          </a>
          <Background />
          <Navigation />
          <ThemeToggle />
          <div id="main-content" tabIndex={-1} className="flex w-full flex-1 flex-col outline-none">
            {children}
          </div>
          <SiteEffects />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
