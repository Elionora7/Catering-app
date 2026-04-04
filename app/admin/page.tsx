'use client'

import { useMeals } from '@/hooks/useMeals'
import { useEvents } from '@/hooks/useEvents'
import { useOrders } from '@/hooks/useOrders'
import Link from 'next/link'

export default function AdminDashboard() {
  const { data: meals, isLoading: mealsLoading } = useMeals()
  const { data: events, isLoading: eventsLoading } = useEvents()
  const { data: orders, isLoading: ordersLoading } = useOrders()

  const stats = {
    totalMeals: meals?.length || 0,
    availableMeals: meals?.filter((m) => m.isAvailable).length || 0,
    totalEvents: events?.length || 0,
    upcomingEvents: events?.filter((e) => new Date(e.date) > new Date()).length || 0,
    totalOrders: orders?.length || 0,
    pendingOrders: orders?.filter((o) => o.status === 'PENDING').length || 0,
  }

  const recentOrders = orders?.slice(0, 5) || []

  const isLoading =
    mealsLoading || eventsLoading || ordersLoading

  if (isLoading) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/admin/meals">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Meals</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalMeals}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {stats.availableMeals} available
                  </p>
                </div>
                <div className="bg-[#D4AF37] bg-opacity-20 rounded-full p-3">
                  <svg
                    className="w-8 h-8 text-[#D4AF37]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/events">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Events</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalEvents}
                  </p>
                  <p className="text-sm text-[#D4AF37] mt-1">
                    {stats.upcomingEvents} upcoming
                  </p>
                </div>
                <div className="bg-[#D4AF37] bg-opacity-20 rounded-full p-3">
                  <svg
                    className="w-8 h-8 text-[#D4AF37]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/orders">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalOrders}
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    {stats.pendingOrders} pending
                  </p>
                </div>
                <div className="bg-yellow-100 rounded-full p-3">
                  <svg
                    className="w-8 h-8 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/quotes">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Quote Requests</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {/* TODO: Add quote count when hook is created */}
                    0
                  </p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-[#D4AF37] hover:opacity-80 text-sm"
            >
              View all →
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex justify-between items-center border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {order.user?.name || order.user?.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.deliveryDate).toLocaleDateString()} • {order.orderType || 'STANDARD'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'CONFIRMED'
                          ? 'bg-[#D4AF37] bg-opacity-20 text-[#D4AF37]'
                          : order.status === 'DELIVERED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No orders yet</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/meals/new"
              className="bg-[#D4AF37] text-white px-6 py-3 rounded-lg hover:opacity-90 text-center font-medium"
            >
              Add New Meal
            </Link>
            <Link
              href="/admin/events/new"
              className="bg-[#D4AF37] text-white px-6 py-3 rounded-lg hover:opacity-90 text-center font-medium"
            >
              Create Event
            </Link>
            <Link
              href="/admin/orders"
              className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 text-center font-medium"
            >
              Manage Orders
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
