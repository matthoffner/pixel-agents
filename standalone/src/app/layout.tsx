import type { Metadata, Viewport } from 'next'
import '../index.css'

export const metadata: Metadata = {
  title: 'Pixel Agents',
  description: 'Pixel art office where your Claude Code agents come to life',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pixel Agents',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a14',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')`,
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', width: '100vw', height: '100vh', background: '#0a0a14' }}>
        {children}
      </body>
    </html>
  )
}
