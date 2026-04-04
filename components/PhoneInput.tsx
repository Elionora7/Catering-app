'use client'

import { useState, useEffect } from 'react'

interface PhoneInputProps {
  value: string
  onChange: (phone: string) => void
  placeholder?: string
  required?: boolean
  id?: string
  className?: string
}

// Australian phone number validation and formatting
const formatAustralianPhone = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')
  
  // Handle different formats
  if (digits.startsWith('61')) {
    // International format: 61XXXXXXXXX
    const local = digits.slice(2)
    if (local.length <= 9) {
      if (local.length <= 4) return `+61 ${local}`
      if (local.length <= 7) return `+61 ${local.slice(0, 4)} ${local.slice(4)}`
      return `+61 ${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
    }
  } else if (digits.startsWith('0')) {
    // Local format: 0XXXXXXXXX
    const local = digits.slice(1)
    if (local.length <= 9) {
      if (local.length <= 4) return `0${local}`
      if (local.length <= 7) return `0${local.slice(0, 4)} ${local.slice(4)}`
      return `0${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
    }
  } else if (digits.length > 0) {
    // Assume local format without leading 0
    if (digits.length <= 9) {
      if (digits.length <= 4) return digits
      if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    }
  }
  
  return value
}

const validateAustralianPhone = (phone: string): { isValid: boolean; error?: string } => {
  const digits = phone.replace(/\D/g, '')
  
  // Must be 10 digits (local) or 11 digits (with country code 61)
  if (digits.length < 10) {
    return { isValid: false, error: 'Phone number must be at least 10 digits' }
  }
  
  if (digits.length > 11) {
    return { isValid: false, error: 'Phone number is too long' }
  }
  
  // Check if it's a valid Australian mobile or landline
  // Australian mobile: 04XX XXX XXX (10 digits starting with 04)
  // Australian landline: 0X XXXX XXXX (10 digits)
  // International: 61 4XX XXX XXX or 61 X XXXX XXXX
  
  let phoneDigits = digits
  if (digits.startsWith('61')) {
    phoneDigits = digits.slice(2)
  } else if (digits.startsWith('0')) {
    phoneDigits = digits.slice(1)
  }
  
  // Must be 9 digits after removing country code or leading 0
  if (phoneDigits.length !== 9) {
    return { isValid: false, error: 'Invalid phone number format' }
  }
  
  // Mobile numbers start with 4
  if (phoneDigits.startsWith('4')) {
    return { isValid: true }
  }
  
  // Landline numbers
  return { isValid: true }
}

export function PhoneInput({
  value,
  onChange,
  placeholder = '+61 4XX XXX XXX or 04XX XXX XXX',
  required = false,
  id = 'phone',
  className = '',
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [error, setError] = useState<string>('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const formatted = formatAustralianPhone(inputValue)
    setDisplayValue(formatted)
    onChange(formatted)
    
    if (touched) {
      const validation = validateAustralianPhone(formatted)
      setError(validation.error || '')
    }
  }

  const handleBlur = () => {
    setTouched(true)
    const validation = validateAustralianPhone(displayValue)
    setError(validation.error || '')
  }

  return (
    <div>
      <input
        type="tel"
        id={id}
        required={required}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full border ${
          error && touched ? 'border-red-500' : 'border-gray-300'
        } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${className}`}
        placeholder={placeholder}
      />
      {error && touched && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {!error && displayValue && touched && (
        <p className="mt-1 text-sm text-green-600">✓ Valid Australian phone number</p>
      )}
    </div>
  )
}



