'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/admin-login')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-gray-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <div className="space-x-4">
            <a href="/admin" className="hover:text-gray-300">Dashboard</a>
            <a href="/admin/meals" className="hover:text-gray-300">Meals</a>
            <a href="/admin/events" className="hover:text-gray-300">Events</a>
            <a href="/admin/orders" className="hover:text-gray-300">Orders</a>
            <a href="/" className="hover:text-gray-300">Back to Site</a>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}

