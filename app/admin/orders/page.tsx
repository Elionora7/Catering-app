'use client'

import { useState } from 'react'
import type { Meal } from '@/hooks/useMeals'
import { formatOrderItemDisplayName } from '@/lib/foodWarmerCopy'
import { useOrders, Order } from '@/hooks/useOrders'

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERED',
  'CANCELLED',
]

// CSV Export utility
function exportToCSV(orders: Order[], filename: string = 'orders-export.csv') {
  // CSV Headers
  const headers = [
    'Order ID',
    'Customer Name',
    'Customer Email',
    'Status',
    'Total Amount',
    'Items Count',
    'Items',
    'Delivery Date',
  ]

  // Convert orders to CSV rows
  const rows = orders.map((order) => {
    const items = order.items
      .map((item) => `${formatOrderItemDisplayName(item.meal as Meal, item.size)} (x${item.quantity})`)
      .join('; ')
    
    return [
      order.id,
      order.user?.name || 'N/A',
      order.user?.email || 'N/A',
      order.status,
      order.totalAmount.toFixed(2),
      order.items.length.toString(),
      items,
      new Date(order.deliveryDate).toLocaleString(),
    ]
  })

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function AdminOrdersPage() {
  const { data: orders, isLoading } = useOrders()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const handleExportCSV = () => {
    if (!orders || orders.length === 0) {
      alert('No orders to export')
      return
    }

    const filtered = statusFilter === 'ALL' 
      ? orders 
      : orders.filter(o => o.status === statusFilter)
    
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `orders-${statusFilter.toLowerCase()}-${timestamp}.csv`
    exportToCSV(filtered, filename)
  }

  const filteredOrders =
    orders?.filter(
      (order) => statusFilter === 'ALL' || order.status === statusFilter
    ) || []

  if (isLoading) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold">Manage Orders</h1>
          <button
            onClick={handleExportCSV}
            disabled={!orders || orders.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transition-colors"
          >
            Export CSV ({filteredOrders.length} orders)
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="ALL">All Orders</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{order.id.slice(0, 8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.items.length} item(s)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.user?.name || '—'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.user?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            ${order.totalAmount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'CONFIRMED'
                                ? 'bg-[#D4AF37] bg-opacity-20 text-[#D4AF37]'
                                : order.status === 'PREPARING'
                                ? 'bg-purple-100 text-purple-800'
                                : order.status === 'READY'
                                ? 'bg-[#D4AF37] bg-opacity-30 text-[#D4AF37]'
                                : order.status === 'DELIVERED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(order.deliveryDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.deliveryDate).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Order Details</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-medium">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">
                      {selectedOrder.user?.name || '—'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedOrder.user?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedOrder.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedOrder.status === 'CONFIRMED'
                          ? 'bg-[#D4AF37] bg-opacity-20 text-[#D4AF37]'
                          : selectedOrder.status === 'PREPARING'
                          ? 'bg-purple-100 text-purple-800'
                          : selectedOrder.status === 'READY'
                          ? 'bg-[#D4AF37] bg-opacity-30 text-[#D4AF37]'
                          : selectedOrder.status === 'DELIVERED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {new Date(selectedOrder.deliveryDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Items</p>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm border-b pb-2"
                        >
                          <div>
                            <p className="font-medium">{formatOrderItemDisplayName(item.meal as Meal, item.size)}</p>
                            <p className="text-gray-500">
                              Qty: {item.quantity} × ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span className="text-yellow-600">
                        ${selectedOrder.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-center">
                  Select an order to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

