'use client'

import { signIn } from 'next-auth/react'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PageBackground } from '@/components/PageBackground'

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const redirect = searchParams?.get('redirect') || '/admin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
    } else {
      router.push(redirect)
      router.refresh()
    }
  }

  return (
    <PageBackground>
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div>
              <h1 className="text-2xl font-bold text-center text-[#0F3D3E] font-playfair">Staff sign in</h1>
              <p className="text-center text-sm text-gray-600 mt-2">Admin access only</p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="admin-email" className="block text-sm font-medium text-[#0F3D3E]">
                    Email
                  </label>
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label htmlFor="admin-password" className="block text-sm font-medium text-[#0F3D3E]">
                    Password
                  </label>
                  <input
                    id="admin-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37]"
                >
                  Sign in
                </button>
              </div>
              <div className="text-center text-sm">
                <Link href="/" className="text-[#D4AF37] hover:opacity-80">
                  ← Back to site
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </PageBackground>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <PageBackground>
          <main className="min-h-screen flex items-center justify-center p-8">
            <div className="max-w-md w-full">
              <div className="bg-white rounded-lg shadow-xl p-8 text-center">Loading...</div>
            </div>
          </main>
        </PageBackground>
      }
    >
      <AdminLoginContent />
    </Suspense>
  )
}
