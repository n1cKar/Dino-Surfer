import Footer from '@/components/Footer'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <main className="min-h-screen flex items-center justify-center p-5 bg-white">
        <div className="w-full max-w-md text-center">
          <h1 className="text-5xl font-extrabold mb-6">Endless Runner</h1>
          <p className="mb-6 text-gray-700">Black-and-white silhouette runner. Switch lanes & jump to avoid obstacles.</p>
          <Link href="/game" className="inline-block px-8 py-4 bg-black text-white rounded-lg text-lg">
            Start Game
          </Link>
          <div className="mt-8 text-sm text-gray-600 p-5">
            Controls: Arrow Left / Right to switch lanes, Space to jump.<br />
            On mobile use on-screen buttons.
          </div>
          <Footer />
        </div>
      </main>
    </>
  )
}
