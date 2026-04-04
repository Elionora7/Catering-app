'use client'

import { useState, useEffect, useRef } from 'react'

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string) => void
  onAddressSelect: (addressData: {
    street: string
    city: string
    state: string
    postcode: string
    country: string
  }) => void
  placeholder?: string
  required?: boolean
  id?: string
  className?: string
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Start typing your address...',
  required = false,
  id = 'address',
  className = '',
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)

  // Initialize Google Places services
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
      
      // Create a dummy div for PlacesService
      const dummyDiv = document.createElement('div')
      placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv)
    } else {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        // Wait for existing script to load
        existingScript.addEventListener('load', () => {
          if (window.google?.maps?.places) {
            autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
            const dummyDiv = document.createElement('div')
            placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv)
          }
        })
        return
      }

      // Load Google Maps script if not already loaded
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        console.warn('Google Maps API key not found. Address autocomplete will not work. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.')
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
          const dummyDiv = document.createElement('div')
          placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv)
        }
      }
      script.onerror = () => {
        console.error('Failed to load Google Maps API. Address autocomplete will not work.')
      }
      document.head.appendChild(script)
    }
  }, [])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value
    onChange(inputValue)

    if (inputValue.length > 2 && autocompleteServiceRef.current) {
      setIsLoading(true)
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: inputValue,
          componentRestrictions: { country: 'au' }, // Restrict to Australia
          types: ['address'],
        },
        (predictions, status) => {
          setIsLoading(false)
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions)
            setShowSuggestions(true)
          } else {
            setSuggestions([])
            setShowSuggestions(false)
            // Don't show error for ZERO_RESULTS - that's normal
            if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              console.warn('Google Places API error:', status)
            }
          }
        }
      )
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelectSuggestion = (placeId: string) => {
    if (!placesServiceRef.current) return

    placesServiceRef.current.getDetails(
      {
        placeId,
        fields: [
          'address_components',
          'formatted_address',
          'geometry',
        ],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const addressComponents = place.address_components || []
          
          let street = ''
          let city = ''
          let state = ''
          let postcode = ''
          let country = 'Australia'

          addressComponents.forEach((component) => {
            const types = component.types

            if (types.includes('street_number')) {
              street = component.long_name + ' '
            }
            if (types.includes('route')) {
              street += component.long_name
            }
            if (types.includes('locality') || types.includes('sublocality')) {
              city = component.long_name
            }
            if (types.includes('administrative_area_level_1')) {
              state = component.short_name
            }
            if (types.includes('postal_code')) {
              postcode = component.long_name
            }
            if (types.includes('country')) {
              country = component.long_name
            }
          })

          onChange(place.formatted_address || street)
          onAddressSelect({
            street: place.formatted_address || street,
            city,
            state,
            postcode,
            country,
          })

          setShowSuggestions(false)
          setSuggestions([])
        }
      }
    )
  }

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        id={id}
        required={required}
        rows={3}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true)
          }
        }}
        className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${className}`}
        placeholder={placeholder}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#D4AF37]"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion.place_id)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{suggestion.structured_formatting.main_text}</div>
              <div className="text-sm text-gray-500">{suggestion.structured_formatting.secondary_text}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

