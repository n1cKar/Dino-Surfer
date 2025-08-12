'use client'

import dynamic from 'next/dynamic'
import MobileControls from '../../components/MobileControls'
import Footer from '@/components/Footer'

// dynamic to avoid SSR
const GameCanvas3D = dynamic(() => import('../../components/GameCanvas3D'), { ssr: false })

export default function GamePage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white">
      <GameCanvas3D />
      <MobileControls />
      <Footer />
    </div>
  )
}
