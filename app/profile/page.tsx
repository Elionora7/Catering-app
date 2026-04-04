'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import PageContainer from '@/components/PageContainer'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { PhoneInput } from '@/components/PhoneInput'
import { AUSTRALIAN_STATES, COUNTRIES } from '@/utils/countries-states'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Australia',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setFormData({
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        postcode: profile.postcode || '',
        country: profile.country || 'Australia',
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!session) {
      return
    }

    try {
      await updateProfile.mutateAsync(formData)
      setSuccess('Profile saved successfully!')
      setTimeout(() => {
        setSuccess('')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    }
  }

  if (status === 'loading' || profileLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </PageContainer>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <PageContainer>
        <div className="max-w-lg mx-auto mt-12 rounded-lg border border-[#D4AF37]/40 bg-[#FFF9EB] p-8 text-center">
          <h1 className="text-2xl font-bold text-[#0F3D3E] mb-3">Profile</h1>
          <p className="text-[#0F3D3E]/90 mb-2">
            No account is required to order. Use checkout to place your order with your contact details.
          </p>
          <p className="text-sm text-[#0F3D3E]/70 mb-6">
            Customer accounts are paused for now. Saved profiles will return in a future update.
          </p>
          <Link
            href="/checkout"
            className="inline-block rounded-md bg-[#D4AF37] px-6 py-2.5 font-semibold text-[#0F3D3E] hover:opacity-90"
          >
            Go to checkout
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        <h1 className="mt-6 mb-6 text-3xl font-bold tracking-wide">My Profile</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={session?.user?.email || ''}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={session?.user?.name || ''}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Name cannot be changed here</p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <PhoneInput
                id="phone"
                required
                value={formData.phone}
                onChange={(phone) =>
                  setFormData({
                    ...formData,
                    phone,
                  })
                }
                placeholder="+61 4XX XXX XXX or 04XX XXX XXX"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your Australian mobile or landline number
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Address Information</h2>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <AddressAutocomplete
                id="address"
                required
                value={formData.address}
                onChange={(address) =>
                  setFormData({
                    ...formData,
                    address,
                  })
                }
                onAddressSelect={(addressData) => {
                  setFormData({
                    ...formData,
                    address: addressData.street,
                    city: addressData.city,
                    state: addressData.state,
                    postcode: addressData.postcode,
                    country: addressData.country,
                  })
                }}
                placeholder="Start typing your address to see suggestions..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Start typing and select from address suggestions to auto-fill all fields
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      city: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="Sydney"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <select
                  id="state"
                  required
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white"
                >
                  <option value="">Select a state</option>
                  {AUSTRALIAN_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name} ({state.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode *
                </label>
                <input
                  type="text"
                  id="postcode"
                  required
                  value={formData.postcode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      postcode: e.target.value.replace(/\D/g, '').slice(0, 4),
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="2000"
                  maxLength={4}
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      country: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="px-6 py-2 bg-[#D4AF37] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}


