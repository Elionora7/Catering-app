# Eliora Signature Catering - Project Summary

## 🎯 Project Overview

**Full-stack catering management application** for Eliora Signature Catering - Authentic Lebanese Catering in Sydney. Built with Next.js 16, TypeScript, PostgreSQL, and Stripe integration.

---

## 📦 Technology Stack (Latest Versions)

### Core Framework
- **Next.js**: 16.0.3 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Node.js**: 18+

### Frontend
- **Tailwind CSS**: 3.3.0
- **Framer Motion**: 12.23.25 (animations)
- **React Query**: 5.17.9 (server state)
- **React Context**: Client state (cart)

### Backend
- **Next.js API Routes**: Server-side endpoints
- **NextAuth.js**: 4.24.5 (authentication)
- **Prisma**: 5.7.1 (ORM)
- **PostgreSQL**: Database (via Docker)

### Payment & Features
- **Stripe**: 20.0.0 (payment processing)
- **bcryptjs**: 2.4.3 (password hashing)
- **Zod**: 3.22.4 (validation)
- **QR Code**: react-qr-code 2.0.18

---

## 🗄️ Database Schema (8 Models)

### User
- `id`, `email` (unique), `name`, `password` (hashed), `role` (CUSTOMER/ADMIN)
- Relations: `orders[]`, `prebookings[]`, `profile?`

### Meal
- `id`, `name`, `description`, `price`, `imageUrl`, `category`
- `mealType` (DAILY/EVENT/BOTH), `isAvailable`
- **Dietary**: `isVegan`, `isVegetarian`, `isGlutenFree`
- **Allergies**: `containsEgg`, `containsWheat`, `containsPeanut`
- **NDIS Support**: `isNDISReady` (displays `[NDIS Ready]` badge on daily meals)
- Relations: `orderItems[]`

### Event
- `id`, `name`, `description`, `date`, `location`, `maxGuests`
- Relations: `prebookings[]`

### Order
- `id`, `userId`, `status` (PENDING→CONFIRMED→PREPARING→READY→DELIVERED), `totalAmount`
- `deliveryDate`, `postcode`, `deliveryZoneId`
- Relations: `user`, `items[]`

### OrderItem
- `id`, `orderId`, `mealId`, `quantity`, `price` (snapshot)
- Relations: `order`, `meal`

### Prebooking
- `id`, `userId`, `eventId`, `guestCount`, `status` (PENDING/CONFIRMED/CANCELLED)
- `specialRequests` (contains structured booking details)
- Relations: `user`, `event`

### DeliveryZone
- `id`, `postcode`, `suburb`, `isActive`
- Used for postcode validation

### UserProfile
- `id`, `userId` (unique), `phone`, `address`, `city`, `state`, `postcode`, `country`
- Relations: `user` (one-to-one)

---

## 🏗️ Architecture Overview

### Application Structure
```
catering-app/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (RESTful)
│   ├── admin/             # Admin pages (protected)
│   ├── auth/              # Login/Register
│   ├── menu/              # Menu browsing
│   ├── cart/              # Shopping cart
│   ├── checkout/          # 3-step checkout
│   ├── prebooking/        # Booking system
│   └── profile/           # User profile
├── components/            # Reusable React components
├── context/               # React Context (Cart)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities (Prisma, Auth)
├── prisma/                # Database schema & migrations
├── types/                 # TypeScript definitions
└── utils/                 # Helper functions
```

### State Management Architecture

**Server State (React Query)**
- `useMeals()` - All meals
- `useDailyMeals()` - Daily meals (includes NDIS Ready)
- `useEventMeals()` - Event meals
- `useEvents()` - All events
- `useOrders()` - User orders
- `usePrebookings()` - User prebookings
- `useProfile()` - User profile

**Client State (React Context)**
- `CartContext` - Shopping cart (persisted in localStorage)

**Session State (NextAuth)**
- JWT-based sessions (30 days)
- User role (ADMIN/CUSTOMER)
- Protected routes

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - Login/session

### Meals
- `GET /api/meals?type=daily|event` - List meals (filtered)
- `POST /api/meals` - Create meal (Admin)
- `GET /api/meals/[id]` - Get meal
- `PUT /api/meals/[id]` - Update meal (Admin)
- `DELETE /api/meals/[id]` - Delete meal (Admin)

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event (Admin)
- `GET /api/events/[id]` - Get event
- `PUT /api/events/[id]` - Update event (Admin)
- `DELETE /api/events/[id]` - Delete event (Admin)

### Orders
- `GET /api/orders` - List orders (role-filtered)
- `POST /api/orders` - Create order
- `POST /api/orders/send-confirmation` - Send email

### Prebookings
- `GET /api/prebooking` - List prebookings (role-filtered)
- `POST /api/prebooking` - Create prebooking
- `GET /api/prebooking/[id]` - Get prebooking
- `PUT /api/prebooking/[id]` - Update prebooking
- `DELETE /api/prebooking/[id]` - Delete prebooking

### Payments
- `POST /api/payments/create-intent` - Create Stripe Payment Intent
- `POST /api/payments/confirm` - Verify payment

### Delivery
- `POST /api/delivery-zones/validate` - Validate postcode
- `POST /api/delivery-zones/check` - Check availability

### Profile
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile

---

## 🎨 Key Features

### Customer Features
1. **Menu Browsing** - Browse meals with NDIS Ready badges
2. **Shopping Cart** - Add/remove items, adjust quantities
3. **Prebooking System**:
   - Daily subscriptions (1-52 weeks, discounts: 5%/10%/15%)
   - Event bookings (with delivery fees)
4. **Checkout** - 3-step process (Delivery → Payment → Review)
5. **Stripe Payment** - Secure card processing
6. **Profile Management** - Save addresses, view orders
7. **QR Code Menu** - Shareable menu QR codes

### Admin Features
1. **Dashboard** - Statistics and recent activity
2. **Meal Management** - CRUD with NDIS marking
3. **Event Management** - CRUD with capacity tracking
4. **Order Management** - Status updates, CSV export
5. **Prebooking Oversight** - View all bookings

### Technical Features
1. **Authentication** - JWT sessions, role-based access
2. **Delivery Zone Validation** - Real-time postcode checking
3. **Responsive Design** - Mobile-first approach
4. **State Persistence** - Cart saved in localStorage
5. **URL Parameter Support** - Pre-fill forms from widgets

---

## 🔐 Security Architecture

### Authentication Flow
1. User registers/logs in → Credentials validated
2. Password hashed with bcryptjs (10 rounds)
3. JWT token created (30-day expiration)
4. Token stored in secure cookie
5. Protected routes check token via `requireAuth()`

### Authorization Levels
- **Public**: Menu, home page
- **Authenticated**: Cart, checkout, prebooking, profile
- **Admin Only**: `/admin/*` routes, admin API endpoints

### Data Protection
- Passwords: bcryptjs hashed
- API Routes: Protected with middleware
- Input Validation: Zod schemas
- SQL Injection: Prisma parameterized queries
- XSS: React escaping

---

## 📱 Pages & Routes

### Public Pages
- `/` - Home page (Hero, specialties, testimonials)
- `/menu` - Menu browsing
- `/menu/qr` - QR code page
- `/event/[id]` - Event details

### Authenticated Pages
- `/auth/login` - Login
- `/auth/register` - Registration
- `/prebooking` - Create prebooking (accepts URL params from widget)
- `/cart` - Shopping cart
- `/checkout` - Checkout process
- `/profile` - User profile

### Admin Pages
- `/admin` - Dashboard
- `/admin/meals` - Meal list
- `/admin/meals/new` - Create meal
- `/admin/meals/[id]/edit` - Edit meal
- `/admin/events` - Event list
- `/admin/events/new` - Create event
- `/admin/events/[id]/edit` - Edit event
- `/admin/orders` - Order management

---

## 🔄 Data Flow Examples

### Order Creation Flow
```
1. Customer adds meals to cart (CartContext)
2. Navigates to /checkout
3. Fills delivery info → Validates postcode
4. Enters payment → Stripe Payment Intent created
5. Payment processed → Verified
6. Order created in DB → Cart cleared
7. Email sent → Redirect to home
```

### Prebooking Flow
```
1. Customer creates prebooking → Saved as PENDING
2. Prebooking added to cart
3. Checkout with prebooking → Payment processed
4. Prebooking status → CONFIRMED
5. Email confirmation sent
```

### Admin Order Processing
```
1. Order created → Status: PENDING
2. Admin confirms → Status: CONFIRMED
3. Kitchen starts → Status: PREPARING
4. Order ready → Status: READY
5. Delivered → Status: DELIVERED
```

---

## 💰 Business Logic

### Daily Subscription Pricing
```
Subtotal = (Days/week × Weeks) × Guests × Sum(meal prices)
Discount: 4+ weeks = 5%, 8+ weeks = 10%, 12+ weeks = 15%
Total = Subtotal - Discount
```

### Event Pricing
```
Subtotal = Sum(meal prices) × Guest count
Delivery: ≤20 guests = $25, >20 guests = $50
Total = Subtotal + Delivery Fee
```

### Booking Rules
- **Daily**: Minimum 2 days notice
- **Event ≤20 guests**: Minimum 7 days notice
- **Event >20 guests**: Minimum 14 days notice

---

## 🎯 Latest Updates Included

### NDIS Support
- `isNDISReady` field added to Meal model
- Badge displays `[NDIS Ready]` on daily meals
- Admin can mark meals as NDIS-friendly
- No separate category - remains under Daily Meals

### BookingWidget Integration
- Desktop widget (bottom-right) and mobile widget (bottom bar)
- Passes data via URL parameters to prebooking page
- Pre-fills: booking type, guest count, date (for events)

### Branding Updates
- Company name: "Eliora Signature Catering"
- Tagline: "Authentic Lebanese Catering in Sydney"
- Description: "Fresh Mediterranean-Inspired Cuisine for Events & Daily Meals"

---

## 🛠️ How to Modify Key Components

### Add a New Meal Field
1. Update `prisma/schema.prisma` - Add field to Meal model
2. Run migration: `npm run db:migrate`
3. Update `hooks/useMeals.ts` - Add to Meal interface
4. Update `utils/validators.ts` - Add to mealSchema
5. Update admin forms: `app/admin/meals/new/page.tsx` and `edit/page.tsx`
6. Update API routes: `app/api/meals/route.ts` and `[id]/route.ts`
7. Update display: `components/MealCard.tsx` (if needed)

### Add a New API Endpoint
1. Create file: `app/api/[endpoint]/route.ts`
2. Export GET/POST/PUT/DELETE functions
3. Add authentication: `await requireAuth(request)` or `await requireAdmin(request)`
4. Add validation: Use Zod schema from `utils/validators.ts`
5. Use Prisma: `prisma.model.action()`
6. Return: `NextResponse.json(data)`

### Add a New Page
1. Create file: `app/[route]/page.tsx`
2. Use 'use client' if using hooks/state
3. Import components and hooks
4. Add to navigation: `components/Navbar.tsx` or `MobileMenu.tsx`

### Modify Authentication
- Config: `lib/auth.ts`
- Helpers: `lib/auth-helpers.ts`
- Session: Uses NextAuth JWT strategy
- Protected routes: Use `requireAuth()` or `requireAdmin()`

### Modify Cart Behavior
- Context: `context/CartContext.tsx`
- Storage: localStorage key `'catering-app-cart'`
- Add functions: `addItem()`, `removeItem()`, `updateQuantity()`

### Modify Database Schema
1. Edit `prisma/schema.prisma`
2. Create migration: `npm run db:migrate dev --name [name]`
3. Generate client: `npm run db:generate`
4. Update TypeScript interfaces in hooks

### Modify Styling
- Global styles: `app/globals.css`
- Tailwind config: `tailwind.config.ts`
- Component styles: Inline Tailwind classes
- Brand colors: Defined in `globals.css` CSS variables

### Modify Payment Processing
- Stripe config: `lib/stripe.ts` (if exists)
- Payment Intent: `app/api/payments/create-intent/route.ts`
- Payment confirmation: `app/api/payments/confirm/route.ts`
- Checkout integration: `app/checkout/page.tsx`

---

## 📊 Project Statistics

- **Total Files**: 50+ TypeScript/TSX files
- **API Routes**: 15+ endpoints
- **Pages**: 15+ pages
- **Components**: 20+ reusable components
- **Hooks**: 4 custom React hooks
- **Database Models**: 8 models
- **Validation Schemas**: 10+ Zod schemas

---

## ✅ Current Status

**Production Ready** ✅

All core features implemented:
- ✅ Authentication & authorization
- ✅ Menu system with NDIS support
- ✅ Shopping cart
- ✅ Prebooking system (daily & event)
- ✅ Checkout with Stripe
- ✅ Admin panel (full CRUD)
- ✅ Delivery zone validation
- ✅ QR code system
- ✅ BookingWidget integration
- ✅ Responsive design

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start database
docker-compose up -d postgres

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed  # Optional

# Start development
npm run dev

# Access
# Frontend: http://localhost:3000
# Prisma Studio: npm run db:studio
```

---

## 📝 Environment Variables Required

```env
DATABASE_URL="postgresql://user:password@localhost:5432/catering_app"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NODE_ENV="development"
```

---

This summary provides a complete overview of the project architecture, functionalities, and how to modify different components. All latest updates (NDIS support, BookingWidget integration, branding) are included.
