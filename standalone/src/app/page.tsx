'use client'

import dynamic from 'next/dynamic'

const PixelAgentsApp = dynamic(() => import('../PixelAgentsApp'), { ssr: false })

export default function Page() {
  return <PixelAgentsApp />
}
