import { z } from 'zod'

/**
 * Zod validation schemas for the catering app
 * 
 * Provides type-safe validation for all API endpoints and forms.
 * All schemas include helpful error messages for better UX.
 */

// ============================================================================
// User validation schemas
// ============================================================================

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
})

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ============================================================================
// Meal validation schemas
// ============================================================================

export const mealSchema = z.object({
  name: z
    .string()
    .min(1, 'Meal name is required')
    .max(200, 'Meal name must be less than 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  price: z
    .number({
      required_error: 'Price is required',
      invalid_type_error: 'Price must be a number',
    })
    .positive('Price must be positive')
    .max(10000, 'Price must be less than $10,000'),
  imageUrl: z
    .string()
    .url('Invalid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  category: z
    .string()
    .max(100, 'Category must be less than 100 characters')
    .optional()
    .nullable(),
  isAvailable: z.boolean().default(true),
  mealType: z.enum(['DAILY', 'EVENT', 'BOTH']).default('DAILY'),
  pricingType: z.enum(['PER_ITEM', 'PER_DOZEN', 'PER_PERSON', 'PER_SKEWER', 'SIZED']).default('PER_ITEM').optional(),
  priceSmall: z.number().positive().optional().nullable(),
  priceMedium: z.number().positive().optional().nullable(),
  priceLarge: z.number().positive().optional().nullable(),
  priceBainMarie: z.number().positive().optional().nullable(),
  minimumQuantity: z.number().int().positive().optional().nullable(),
  isNDISReady: z.boolean().default(false),
  // Allergy and dietary information
  containsEgg: z.boolean().default(false),
  containsWheat: z.boolean().default(false),
  containsPeanut: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isVegetarian: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  ingredients: z
    .string()
    .max(2000, 'Ingredients must be less than 2000 characters')
    .optional()
    .nullable(),
  allergyNotes: z
    .string()
    .max(1000, 'Allergy notes must be less than 1000 characters')
    .optional()
    .nullable(),
})

export const updateMealSchema = mealSchema.partial().extend({
  name: z
    .string()
    .min(1, 'Meal name is required')
    .max(200, 'Meal name must be less than 200 characters')
    .optional(),
  price: z
    .number({
      invalid_type_error: 'Price must be a number',
    })
    .positive('Price must be positive')
    .max(10000, 'Price must be less than $10,000')
    .optional(),
})

// ============================================================================
// Event validation schemas
// ============================================================================

export const eventSchema = z.object({
  name: z
    .string()
    .min(1, 'Event name is required')
    .max(200, 'Event name must be less than 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  date: z.coerce.date({
    required_error: 'Event date is required',
    invalid_type_error: 'Invalid date format',
  }),
  location: z
    .string()
    .max(200, 'Location must be less than 200 characters')
    .optional()
    .nullable(),
  maxGuests: z
    .number()
    .int('Max guests must be an integer')
    .positive('Max guests must be positive')
    .max(10000, 'Max guests must be less than 10,000')
    .optional()
    .nullable(),
})

export const updateEventSchema = eventSchema.partial().extend({
  name: z
    .string()
    .min(1, 'Event name is required')
    .max(200, 'Event name must be less than 200 characters')
    .optional(),
  date: z.coerce.date({
    invalid_type_error: 'Invalid date format',
  }).optional(),
})

// ============================================================================
// Order validation schemas
// ============================================================================

// Australian postcode validation: exactly 4 digits
const australianPostcodeRegex = /^\d{4}$/

export const orderItemSchema = z.object({
  mealId: z.string().min(1, 'Meal ID is required'),
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int('Quantity must be an integer')
    .positive('Quantity must be positive')
    .max(100, 'Quantity must be less than 100'),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'BAIN_MARIE']).optional().nullable(),
  bainMarieFee: z.number().min(0).default(0).optional(),
})

export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Maximum 50 items per order'),
  orderType: z.enum(['STANDARD', 'EVENT'], {
    errorMap: () => ({ message: 'Order type must be STANDARD or EVENT' }),
  }),
  isEventConfirmed: z.boolean().optional().default(false),
  deliveryDate: z.coerce.date({
    required_error: 'Delivery date is required',
    invalid_type_error: 'Invalid date format',
  }),
  deliveryType: z.enum(['DELIVERY', 'PICKUP'], {
    errorMap: () => ({ message: 'Delivery type must be DELIVERY or PICKUP' }),
  }),
  postcode: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z
      .string()
      .regex(australianPostcodeRegex, 'Postcode must be exactly 4 digits (Australian format)')
      .optional()
  ),
  suburb: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z
      .string()
      .min(1, 'Suburb is required')
      .max(200, 'Suburb must be less than 200 characters')
      .optional()
  ),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .optional(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters')
    .optional(),
  allergiesNote: z
    .string()
    .max(2000, 'Allergy notes must be less than 2000 characters')
    .optional(),
  phoneNumber: z.string().max(40).optional(),
  streetAddress: z.string().max(300).optional(),
  unitNumber: z.string().max(80).optional(),
  state: z.string().max(30).optional(),
  deliveryTime: z.string().max(100).optional(),
  stripeFee: z
    .number()
    .min(0, 'Stripe fee cannot be negative')
    .optional(),
  totalAmount: z
    .number()
    .positive('Total amount must be positive')
    .optional(),
  paymentMethod: z.enum(['STRIPE', 'BANK_TRANSFER'], {
    errorMap: () => ({ message: 'Payment method must be STRIPE or BANK_TRANSFER' }),
  }),
  paymentIntentId: z.string().min(1, 'Payment intent ID is required').optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(
    ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
    {
      errorMap: () => ({ message: 'Invalid order status' }),
    }
  ),
})

// ============================================================================
// Quote Request validation schemas
// ============================================================================

const quoteCartLineItemSchema = z.object({
  id: z.string().max(100, 'Item id is too long'),
  name: z.string().max(200, 'Item name is too long'),
  size: z.string().max(100).optional().nullable(),
  /** Pre-rendered customer-facing size (optional; falls back to `size`). */
  sizeDisplay: z.string().max(300).optional().nullable(),
  quantity: z.number().int().min(1).max(1000, 'Quantity must be at most 1000'),
  price: z.number().nonnegative().finite().max(10000),
})

export const quoteRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be less than 20 characters'),
  eventType: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const trimmed = val.trim()
        // Allow empty eventType (MVP guest quotes). We'll default it.
        return trimmed.length > 0 ? trimmed : undefined
      }
      return val
    },
    z.string().min(1).max(200).optional().default('Catering Event')
  ),
  estimatedGuests: z
    .number({
      invalid_type_error: 'Estimated guests must be a number',
    })
    .int('Estimated guests must be an integer')
    .positive('Estimated guests must be positive')
    .max(100, 'Maximum 100 guests allowed. Please contact us for larger events.')
    .optional()
    .nullable(),
  preferredDate: z.coerce.date({
    invalid_type_error: 'Invalid date format',
  }).optional().nullable(),
  postcode: z
    .string()
    .regex(australianPostcodeRegex, 'Postcode must be exactly 4 digits (Australian format)'),
  suburb: z
    .string()
    .min(1, 'Suburb is required')
    .max(200, 'Suburb must be less than 200 characters'),
  budgetRange: z
    .string()
    .max(100, 'Budget range must be less than 100 characters')
    .optional()
    .nullable(),
  message: z
    .string()
    .max(2000, 'Message must be less than 2000 characters')
    .optional()
    .nullable(),
  cartItems: z
    .array(quoteCartLineItemSchema)
    .optional()
    .default([]),
})

export const createPaymentIntentSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Maximum 50 items per request'),
  deliveryType: z.enum(['delivery', 'pickup']),
  postcode: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z
      .string()
      .regex(australianPostcodeRegex, 'Postcode must be exactly 4 digits (Australian format)')
      .optional()
  ),
  suburb: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().min(1).max(200).optional()
  ),
  totalAmount: z.number().positive().optional(),
  currency: z.string().min(3).max(3).optional().default('aud'),
  email: z.string().email().optional(),
  name: z.string().min(1).max(200).optional(),
  metadata: z.record(z.string(), z.string().max(200)).optional().default({}),
})

const confirmationItemSchema = z.object({
  name: z.string().min(1).max(300),
  quantity: z.number().int().min(0).max(1000),
  price: z.number().min(0).max(100000),
})

export const sendConfirmationSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  phoneNumber: z.string().max(40).optional(),
  orderId: z.string().max(100).optional().nullable(),
  items: z.array(confirmationItemSchema).max(100).optional().default([]),
  totalAmount: z.number().min(0).max(100000),
  subtotal: z.number().min(0).max(100000).optional(),
  deliveryFee: z.number().min(0).max(100000).optional(),
  orderType: z.enum(['STANDARD', 'EVENT']).optional(),
  deliveryDate: z.union([z.string(), z.date()]).optional(),
  deliveryTime: z.string().max(100).optional(),
  deliveryType: z.string().max(20).optional(),
  streetAddress: z.string().max(300).optional(),
  unitNumber: z.string().max(80).optional(),
  suburb: z.string().max(200).optional(),
  state: z.string().max(30).optional(),
  postcode: z.string().max(10).optional(),
  paymentMethod: z.enum(['STRIPE', 'BANK_TRANSFER']).optional(),
  depositAmount: z.number().min(0).max(100000).optional(),
  remainingAmount: z.number().min(0).max(100000).optional(),
  depositRequired: z.boolean().optional(),
  bankPartialDeposit: z.boolean().optional(),
  baseTotal: z.number().min(0).max(100000).optional(),
  paymentSchedule: z.enum(['FULL_STRIPE', 'FULL_BANK', 'BANK_PARTIAL']).optional(),
  finalBalanceDueDate: z.string().max(100).nullable().optional(),
  stripeFee: z.number().min(0).max(100000).optional(),
})

// ============================================================================
// Delivery Zone validation schemas
// ============================================================================

export const deliveryZoneSchema = z.object({
  postcode: z
    .string()
    .min(1, 'Postcode is required')
    .regex(australianPostcodeRegex, 'Postcode must be exactly 4 digits (Australian format)'),
  suburb: z
    .string()
    .max(100, 'Suburb must be less than 100 characters')
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
})

export const updateDeliveryZoneSchema = deliveryZoneSchema.partial().extend({
  postcode: z
    .string()
    .min(1, 'Postcode is required')
    .regex(australianPostcodeRegex, 'Postcode must be exactly 4 digits (Australian format)')
    .optional(),
})

// ============================================================================
// Type exports
// ============================================================================

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type MealInput = z.infer<typeof mealSchema>
export type UpdateMealInput = z.infer<typeof updateMealSchema>
export type EventInput = z.infer<typeof eventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>
export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>
export type UpdateDeliveryZoneInput = z.infer<typeof updateDeliveryZoneSchema>

// ============================================================================
// User Profile validation schemas
// ============================================================================

// Australian phone number validation
const australianPhoneRegex = /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$|^(\+?61|0)4(?:[ -]?[0-9]){8}$/

export const userProfileSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be less than 20 characters')
    .refine(
      (val) => {
        // Remove all non-digit characters for validation
        const digits = val.replace(/\D/g, '')
        // Must be 10 digits (local) or 11 digits (with country code 61)
        if (digits.length < 10 || digits.length > 11) return false
        
        // Check if it's a valid Australian format
        // Remove country code if present
        let phoneDigits = digits
        if (digits.startsWith('61')) {
          phoneDigits = digits.slice(2)
        } else if (digits.startsWith('0')) {
          phoneDigits = digits.slice(1)
        }
        
        // Must be 9 digits after removing country code or leading 0
        return phoneDigits.length === 9 && /^[2-478]/.test(phoneDigits) || /^4/.test(phoneDigits)
      },
      {
        message: 'Please enter a valid Australian phone number (e.g., 04XX XXX XXX or +61 4XX XXX XXX)',
      }
    ),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(200, 'Address must be less than 200 characters'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters'),
  state: z
    .string()
    .min(1, 'State is required')
    .max(100, 'State must be less than 100 characters')
    .refine(
      (val) => {
        const validStates = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']
        return validStates.includes(val.toUpperCase()) || val.length > 2
      },
      {
        message: 'Please enter a valid Australian state or territory',
      }
    ),
  postcode: z
    .string()
    .min(1, 'Postcode is required')
    .regex(australianPostcodeRegex, 'Postcode must be exactly 4 digits (Australian format)'),
  country: z
    .string()
    .max(100, 'Country must be less than 100 characters')
    .optional()
    .default('Australia'),
})

export const updateUserProfileSchema = userProfileSchema.partial()

export type UserProfileInput = z.infer<typeof userProfileSchema>
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>

