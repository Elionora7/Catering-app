# 🏗️ Eliora Signature Catering - Strategic Refactor Analysis Report

**Date**: Generated Analysis  
**Purpose**: Complete removal of daily subscription functionality, conversion to pure event-based ordering system  
**Status**: ⚠️ ANALYSIS ONLY - NO CHANGES IMPLEMENTED

---

## 📋 EXECUTIVE SUMMARY

This report provides a comprehensive analysis of the codebase to support the strategic pivot from a **daily subscription model** to a **pure event-based catering ordering system**.

### Current State
- **Daily Meal Subscriptions**: Complex pricing with weeks/days-per-week logic, discount tiers (5%/10%/15%)
- **Event Bookings**: Guest-based pricing with delivery fees
- **Prebooking System**: Used for both daily subscriptions and event bookings
- **Cart System**: Handles both meal items and prebookings

### Target State
- **Event-Based Only**: Simple menu → cart → checkout → order flow
- **No Subscriptions**: Remove all weekly/duration-based logic
- **No Discount Tiers**: Remove all discount calculations
- **Simplified Pricing**: `subtotal = sum(meal.price × quantity) + deliveryFee`
- **Delivery Zone Pricing**: Configurable `deliveryFee` and `minimumOrder` per zone

---

## 🔍 PHASE 1: COMPLETE IMPACT ANALYSIS

### 1.1 Files Related to Daily Subscription Logic

#### Core Subscription Logic Files
| File Path | Purpose | Subscription Logic Present |
|-----------|---------|---------------------------|
| `app/prebooking/page.tsx` | Main prebooking page | ✅ **CRITICAL** - Lines 23-33, 58-64, 71-79, 200-255, 402-498 |
| `app/cart/page.tsx` | Shopping cart with prebooking editing | ✅ **CRITICAL** - Lines 110-119, 123-126, 134-139, 247-274, 299-400+ |
| `app/checkout/page.tsx` | Checkout with prebooking support | ✅ **CRITICAL** - Lines 16-20, 50-85, 412-426, 447 |
| `components/BookingWidget.tsx` | Desktop booking widget | ⚠️ **MODERATE** - Lines 9, 39-46 (DAILY option) |
| `components/BookingWidgetMobile.tsx` | Mobile booking widget | ⚠️ **MODERATE** - Lines 9, 35-42 (DAILY option) |

#### Discount Calculation Locations
| File Path | Lines | Discount Logic |
|-----------|-------|----------------|
| `app/prebooking/page.tsx` | 71-79 | 4+ weeks = 5%, 8+ weeks = 10%, 12+ weeks = 15% |
| `app/cart/page.tsx` | 252-261 | Same discount tiers in edit modal |
| `PROJECT_SUMMARY.md` | 285-288 | Documentation of discount formula |
| `PROJECT_FUNCTIONALITIES.md` | 134-137, 286-289, 822-830 | Documentation |

#### Weeks/Days Per Week Logic
| File Path | Lines | Logic Description |
|-----------|-------|-------------------|
| `app/prebooking/page.tsx` | 27-28, 60-64, 429-497 | Days per week (1-7), Weeks (1-52), Total meals calculation |
| `app/cart/page.tsx` | 77-87, 115-118, 248-250 | Parsing weeks/days from specialRequests, calculation in edit modal |
| `app/prebooking/page.tsx` | 105-109, 134-139 | Minimum start date (2 days notice) for daily bookings |

#### Guest-Based Price Calculation
| File Path | Lines | Calculation |
|-----------|-------|------------|
| `app/prebooking/page.tsx` | 58-64 | `subtotal = totalMeals × totalPeople × mealsTotal` (DAILY) |
| `app/prebooking/page.tsx` | 66-68 | `subtotal = mealsTotal × guestCount` (EVENT) |
| `app/cart/page.tsx` | 250, 268 | Same calculations in edit modal |
| `app/checkout/page.tsx` | 56-59, 72-75 | Delivery fee based on guest count (>20 = $50, else $25) |

---

### 1.2 Prisma Models Affected

#### Models Requiring Changes

**1. Prebooking Model** (`prisma/schema.prisma` lines 120-133)
```prisma
model Prebooking {
  id          String   @id @default(cuid())
  userId      String
  eventId     String   // ⚠️ Currently required for ALL prebookings (even daily)
  guestCount  Int      // ⚠️ Used for both daily and event calculations
  status      PrebookingStatus @default(PENDING)
  specialRequests String? // ⚠️ Contains serialized subscription data
  // Relations
  user        User     @relation(...)
  event       Event    @relation(...) // ⚠️ Daily bookings use placeholder events
}
```
**Impact**: 
- Currently used for BOTH daily subscriptions AND event bookings
- Daily subscriptions store data in `specialRequests` (serialized string)
- Daily subscriptions use placeholder `eventId` (first event in DB)
- **Decision Required**: Remove entirely OR keep only for future event use

**2. DeliveryZone Model** (`prisma/schema.prisma` lines 141-150)
```prisma
model DeliveryZone {
  id        String   @id @default(cuid())
  postcode  String
  suburb    String?
  isActive  Boolean  @default(true)
  // ⚠️ MISSING: deliveryFee Float
  // ⚠️ MISSING: minimumOrder Float
}
```
**Impact**: 
- Currently only validates postcode
- No pricing information stored
- **Required**: Add `deliveryFee` and `minimumOrder` fields

**3. Order Model** (`prisma/schema.prisma` lines 82-96)
```prisma
model Order {
  id          String      @id @default(cuid())
  userId      String
  status      OrderStatus @default(PENDING)
  totalAmount Float       // ✅ Already exists
  deliveryDate DateTime   // ✅ Already exists
  postcode    String?     // ✅ Already exists
  deliveryZoneId String?  // ✅ Already exists
  // ⚠️ MISSING: subtotal Float (separate from totalAmount)
  // ⚠️ MISSING: deliveryFee Float
  // ⚠️ MISSING: deliveryType Enum (DELIVERY / PICKUP)
}
```
**Impact**: 
- `totalAmount` exists but doesn't break down subtotal vs delivery fee
- No delivery type tracking
- **Required**: Add breakdown fields for clarity

**4. User Model** (`prisma/schema.prisma` lines 13-26)
```prisma
model User {
  // ...
  prebookings   Prebooking[] // ⚠️ Relation to Prebooking
}
```
**Impact**: If Prebooking is removed, this relation must be removed

**5. Event Model** (`prisma/schema.prisma` lines 68-80)
```prisma
model Event {
  // ...
  prebookings Prebooking[] // ⚠️ Relation to Prebooking
}
```
**Impact**: If Prebooking is removed, this relation must be removed

**6. Meal Model** (`prisma/schema.prisma` lines 39-66)
```prisma
model Meal {
  // ...
  mealType    MealType    @default(DAILY) // ⚠️ DAILY, EVENT, BOTH
}
```
**Impact**: 
- `mealType` enum includes `DAILY` and `BOTH`
- **Decision Required**: Keep `DAILY`/`BOTH` for future use OR remove entirely

---

### 1.3 API Routes Affected

#### Routes Requiring Modification

**1. `/api/prebooking` (GET, POST)**
- **File**: `app/api/prebooking/route.ts`
- **Current**: Handles both daily and event prebookings
- **Impact**: 
  - If removing prebookings entirely: **DELETE** this route
  - If keeping for events: Remove daily subscription logic
- **Lines**: 47-206 (POST handles both types)

**2. `/api/prebooking/[id]` (GET, PUT, DELETE)**
- **File**: `app/api/prebooking/[id]/route.ts`
- **Current**: CRUD for prebookings (both types)
- **Impact**: Same as above

**3. `/api/orders` (POST)**
- **File**: `app/api/orders/route.ts`
- **Current**: Creates orders from cart items only
- **Impact**: 
  - Currently doesn't handle prebookings (checkout does that separately)
  - **Required**: Add `subtotal`, `deliveryFee`, `deliveryType` fields
  - **Required**: Add minimum order validation using `DeliveryZone.minimumOrder`
- **Lines**: 47-193

**4. `/api/delivery-zones/validate`**
- **File**: `app/api/delivery-zones/validate/route.ts`
- **Current**: Validates postcode format and existence
- **Impact**: 
  - **Enhancement**: Return `deliveryFee` and `minimumOrder` in response
  - **Required**: Add validation endpoint that returns zone pricing

**5. `/api/delivery-zones/check`**
- **File**: `app/api/delivery-zones/check/route.ts`
- **Current**: Similar to validate
- **Impact**: Same as above

**6. `/api/orders/send-confirmation`**
- **File**: `app/api/orders/send-confirmation/route.ts`
- **Current**: Sends email with order + prebooking details
- **Impact**: 
  - Remove prebooking email logic
  - Simplify to order-only emails
- **Lines**: Likely references prebookings

---

### 1.4 React Hooks Affected

#### Hooks Requiring Changes

**1. `hooks/usePrebookings.ts`**
- **Functions**: `usePrebookings()`, `useCreatePrebooking()`, `useUpdatePrebooking()`, `useDeletePrebooking()`
- **Impact**: 
  - If removing prebookings: **DELETE** entire file
  - If keeping for events: Remove daily subscription references
- **Used By**: 
  - `app/prebooking/page.tsx`
  - `app/cart/page.tsx`
  - `app/checkout/page.tsx`
  - `app/admin/page.tsx`

**2. `hooks/useMeals.ts`**
- **Functions**: `useDailyMeals()`, `useEventMeals()`, `useMeals()`
- **Impact**: 
  - `useDailyMeals()`: **DECISION** - Keep for menu browsing OR remove
  - `useEventMeals()`: Keep (needed for events)
  - `useMeals()`: Keep (general meal fetching)
- **Used By**: 
  - `app/prebooking/page.tsx` (both daily and event)
  - `app/cart/page.tsx` (both)
  - `app/menu/page.tsx` (likely)

**3. `hooks/useOrders.ts`**
- **Impact**: 
  - May need to update Order interface to include new fields
  - Check if it handles prebookings

**4. `hooks/useEvents.ts`**
- **Impact**: 
  - If removing prebookings: Remove prebooking relation from Event interface
  - Otherwise: Keep as-is

---

### 1.5 Components Affected

#### Components Requiring Modification

**1. `app/prebooking/page.tsx`** ⚠️ **CRITICAL**
- **Size**: 668 lines
- **Impact**: 
  - Remove entire DAILY booking type (lines 23, 58-64, 71-79, 200-255, 402-498)
  - Remove weeks/days per week inputs
  - Remove discount calculation
  - Remove start date field
  - Simplify to EVENT-only booking
  - **OR**: Delete entire page if prebookings removed

**2. `app/cart/page.tsx`** ⚠️ **CRITICAL**
- **Size**: 1249 lines
- **Impact**: 
  - Remove prebooking editing logic (lines 107-400+)
  - Remove daily subscription parsing (lines 77-87)
  - Remove discount calculations (lines 252-261)
  - Simplify to meal items only
  - Remove prebooking selection/checkout logic

**3. `app/checkout/page.tsx`** ⚠️ **CRITICAL**
- **Size**: 1910+ lines
- **Impact**: 
  - Remove prebooking handling (lines 16-20, 28, 34-85, 412-426, 447)
  - Remove prebooking total calculations
  - Simplify to cart items only
  - Update delivery fee calculation (use DeliveryZone.deliveryFee)
  - Add minimum order validation

**4. `components/BookingWidget.tsx`**
- **Impact**: 
  - Remove DAILY option (lines 9, 39-46)
  - Keep EVENT only
  - Update URL params

**5. `components/BookingWidgetMobile.tsx`**
- **Impact**: Same as BookingWidget

**6. `app/admin/page.tsx`**
- **Impact**: 
  - Remove prebooking statistics (lines 22-23, 27, 231-269)
  - Remove prebooking recent activity section
  - **OR**: Keep if prebookings retained for events

**7. `app/event/[id]/page.tsx`**
- **Impact**: 
  - Remove prebookings display section (lines 141-174)
  - **OR**: Keep if prebookings retained for events

**8. `components/MealCard.tsx`**
- **Impact**: 
  - May reference mealType (DAILY/EVENT/BOTH)
  - Check if filtering needed

---

### 1.6 Dependencies Between Components

#### Critical Dependency Chains

**Prebooking → Order Flow**
```
PrebookingPage → creates Prebooking (PENDING)
  ↓
CartPage → displays Prebookings, allows editing
  ↓
CheckoutPage → selects Prebookings, confirms them (CONFIRMED)
  ↓
Order created separately (cart items only)
```

**Current Issue**: Prebookings and Orders are separate entities. Orders don't reference prebookings directly.

**Cart → Checkout Flow**
```
CartContext (localStorage) → stores meal items
  ↓
CartPage → displays items + prebookings
  ↓
CheckoutPage → processes both items and prebookings
  ↓
Order API → creates order (items only)
  ↓
Prebooking API → updates prebooking status (CONFIRMED)
```

**Event → Prebooking Flow**
```
EventPage → displays event details
  ↓
PrebookingPage → creates prebooking linked to event
  ↓
Prebooking stored with eventId
```

---

### 1.7 Business Logic Locations

#### Discount Calculation Logic
| Location | Formula | Lines |
|----------|---------|-------|
| `app/prebooking/page.tsx` | `if weeks >= 12: 15%`, `if weeks >= 8: 10%`, `if weeks >= 4: 5%` | 71-79 |
| `app/cart/page.tsx` | Same logic in edit modal | 252-261 |

#### Delivery Fee Calculation Logic
| Location | Formula | Lines |
|----------|---------|-------|
| `app/prebooking/page.tsx` | `guestCount > 20 ? 50 : 25` (EVENT only) | 82 |
| `app/cart/page.tsx` | Same in edit modal | 269 |
| `app/checkout/page.tsx` | Same for prebookings | 56-59, 72-75 |
| **Target**: Use `DeliveryZone.deliveryFee` instead

#### Booking Date Validation Logic
| Location | Rule | Lines |
|----------|------|-------|
| `app/prebooking/page.tsx` | Daily: 2 days notice | 105-109 |
| `app/prebooking/page.tsx` | Event ≤20: 7 days notice | 96-103 |
| `app/prebooking/page.tsx` | Event >20: 14 days notice | 96-103 |
| `app/cart/page.tsx` | Same rules in edit modal | 134-147 |

#### Guest-Based Pricing Logic
| Location | Formula | Lines |
|----------|---------|-------|
| `app/prebooking/page.tsx` | DAILY: `(daysPerWeek × weeks) × guestCount × sum(mealPrices)` | 58-64 |
| `app/prebooking/page.tsx` | EVENT: `sum(mealPrices) × guestCount` | 66-68 |
| **Target**: Remove guest multiplication, use quantity only

---

## 🗄️ PHASE 2: PROPOSED DATABASE CHANGES

### 2.1 Prisma Schema Diff

#### Proposed Changes to `prisma/schema.prisma`

```prisma
// ============================================================================
// REMOVE: Prebooking Model (if removing entirely)
// ============================================================================
// model Prebooking { ... } // DELETE ENTIRE MODEL

// ============================================================================
// MODIFY: DeliveryZone Model
// ============================================================================
model DeliveryZone {
  id          String   @id @default(cuid())
  postcode    String
  suburb      String?
  isActive    Boolean  @default(true)
  deliveryFee Float    @default(0)        // ✅ ADD: Configurable delivery fee
  minimumOrder Float   @default(0)        // ✅ ADD: Minimum order value
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("delivery_zones")
}

// ============================================================================
// MODIFY: Order Model
// ============================================================================
model Order {
  id            String      @id @default(cuid())
  userId        String
  status        OrderStatus @default(PENDING)
  subtotal      Float       // ✅ ADD: Subtotal before delivery fee
  deliveryFee   Float       @default(0)  // ✅ ADD: Delivery fee amount
  totalAmount   Float       // ✅ KEEP: Final total (subtotal + deliveryFee)
  deliveryDate  DateTime
  deliveryType  DeliveryType @default(DELIVERY) // ✅ ADD: DELIVERY or PICKUP
  postcode      String?
  deliveryZoneId String?
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  items         OrderItem[]

  @@map("orders")
}

// ✅ ADD: Delivery Type Enum
enum DeliveryType {
  DELIVERY
  PICKUP
}

// ============================================================================
// MODIFY: User Model (if removing Prebooking)
// ============================================================================
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String
  role          UserRole  @default(CUSTOMER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  orders        Order[]
  // prebookings   Prebooking[] // ❌ REMOVE: If deleting Prebooking model
  profile       UserProfile?

  @@map("users")
}

// ============================================================================
// MODIFY: Event Model (if removing Prebooking)
// ============================================================================
model Event {
  id          String       @id @default(cuid())
  name        String
  description String?
  date        DateTime
  location    String?
  maxGuests   Int?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  // prebookings Prebooking[] // ❌ REMOVE: If deleting Prebooking model

  @@map("events")
}

// ============================================================================
// DECISION: Meal Model - Keep or Remove mealType?
// ============================================================================
model Meal {
  // ... existing fields ...
  mealType    MealType    @default(DAILY) // ⚠️ DECISION: Keep DAILY/BOTH for menu filtering?
  // ... rest of fields ...
}

enum MealType {
  DAILY   // ⚠️ Keep for menu categorization?
  EVENT   // ✅ Keep
  BOTH    // ⚠️ Keep for menu categorization?
}
```

---

### 2.2 Migration Strategy

#### Step 1: Add New Fields (Non-Breaking)
```sql
-- Add deliveryFee and minimumOrder to DeliveryZone
ALTER TABLE "delivery_zones" 
ADD COLUMN "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "minimumOrder" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add subtotal, deliveryFee, deliveryType to Order
ALTER TABLE "orders" 
ADD COLUMN "subtotal" DOUBLE PRECISION,
ADD COLUMN "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "deliveryType" TEXT NOT NULL DEFAULT 'DELIVERY';

-- Backfill existing orders
UPDATE "orders" SET "subtotal" = "totalAmount" - COALESCE("deliveryFee", 0);
```

#### Step 2: Remove Prebooking (If Decided)
```sql
-- ⚠️ WARNING: This deletes all prebooking data
DROP TABLE IF EXISTS "prebookings";
```

#### Step 3: Update Constraints
- Add CHECK constraint for `deliveryType` enum values
- Add validation for `deliveryFee >= 0` and `minimumOrder >= 0`

---

## 🧹 PHASE 3: REFACTOR PLAN PROPOSAL

### 3.1 Safe Refactor Roadmap

#### **STEP 1: Database Schema Updates** (Non-Breaking)
**Goal**: Add new fields without breaking existing functionality

1. **Update Prisma Schema**
   - Add `deliveryFee` and `minimumOrder` to `DeliveryZone`
   - Add `subtotal`, `deliveryFee`, `deliveryType` to `Order`
   - Create `DeliveryType` enum

2. **Create Migration**
   ```bash
   npx prisma migrate dev --name add_delivery_pricing_fields --create-only
   ```

3. **Update Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Backfill Existing Data**
   - Set default `deliveryFee = 0` for all zones
   - Set default `minimumOrder = 0` for all zones
   - Calculate `subtotal` for existing orders

**Risk**: ⚠️ **LOW** - Adding fields is safe, existing code continues to work

---

#### **STEP 2: Update Delivery Zone API** (Non-Breaking)
**Goal**: Return pricing information in validation endpoints

1. **Modify `/api/delivery-zones/validate`**
   - Return `deliveryFee` and `minimumOrder` in response
   - Keep existing validation logic

2. **Modify `/api/delivery-zones/check`**
   - Same as above

3. **Test**: Verify existing checkout flow still works

**Risk**: ⚠️ **LOW** - Adding fields to response is backward compatible

---

#### **STEP 3: Simplify Order Creation** (Breaking - Controlled)
**Goal**: Update order API to use new pricing model

1. **Modify `/api/orders` POST**
   - Calculate `subtotal = sum(meal.price × quantity)`
   - Fetch `deliveryFee` from `DeliveryZone`
   - Calculate `totalAmount = subtotal + deliveryFee`
   - Validate `subtotal >= minimumOrder` (if delivery)
   - Store all three values separately

2. **Update Order Validator**
   - Add `deliveryType` to `createOrderSchema`
   - Add validation for minimum order

3. **Test**: Create test orders to verify calculations

**Risk**: ⚠️ **MEDIUM** - Changes order creation logic, but isolated to one endpoint

---

#### **STEP 4: Remove Prebooking UI - Part 1** (Breaking - Controlled)
**Goal**: Remove daily subscription UI from prebooking page

1. **Modify `app/prebooking/page.tsx`**
   - Remove `bookingType` state (keep EVENT only)
   - Remove `daysPerWeek`, `weeks`, `startDate` fields
   - Remove discount calculation logic
   - Remove DAILY meal selection
   - Simplify to EVENT-only form

2. **Update BookingWidget Components**
   - Remove DAILY option from `BookingWidget.tsx`
   - Remove DAILY option from `BookingWidgetMobile.tsx`
   - Update URL params (remove `type=DAILY`)

3. **Test**: Verify EVENT prebooking still works

**Risk**: ⚠️ **MEDIUM** - Removes functionality, but EVENT path remains

---

#### **STEP 5: Simplify Cart Page** (Breaking - Controlled)
**Goal**: Remove prebooking editing and daily subscription logic

1. **Modify `app/cart/page.tsx`**
   - Remove prebooking editing modal (lines 107-400+)
   - Remove prebooking selection logic
   - Remove daily subscription parsing functions
   - Remove discount calculations
   - Keep only meal items display

2. **Update Cart Checkout Flow**
   - Remove prebooking URL params from checkout redirect
   - Simplify to `/checkout` only

3. **Test**: Verify cart with meal items works

**Risk**: ⚠️ **MEDIUM** - Removes significant functionality

---

#### **STEP 6: Simplify Checkout Page** (Breaking - Controlled)
**Goal**: Remove prebooking handling, use new pricing model

1. **Modify `app/checkout/page.tsx`**
   - Remove prebooking selection logic (lines 34-85)
   - Remove prebooking total calculations
   - Remove prebooking confirmation (lines 412-426)
   - Update delivery fee calculation to use `DeliveryZone.deliveryFee`
   - Add minimum order validation
   - Update order creation to include new fields

2. **Update Email Confirmation**
   - Remove prebooking details from email
   - Simplify to order-only

3. **Test**: Complete checkout flow end-to-end

**Risk**: ⚠️ **HIGH** - Core checkout functionality, extensive testing required

---

#### **STEP 7: Remove Prebooking API** (Breaking - Final)
**Goal**: Delete prebooking endpoints if not needed

**DECISION POINT**: 
- **Option A**: Keep prebookings for future event use (safer)
- **Option B**: Remove entirely (cleaner, but loses event prebooking feature)

**If Option B (Remove)**:
1. Delete `app/api/prebooking/route.ts`
2. Delete `app/api/prebooking/[id]/route.ts`
3. Delete `hooks/usePrebookings.ts`
4. Remove prebooking relations from Prisma schema
5. Create migration to drop `prebookings` table

**If Option A (Keep)**:
1. Keep API routes but remove daily subscription logic
2. Update validators to remove daily-specific fields
3. Keep hooks but simplify interfaces

**Risk**: ⚠️ **HIGH** - Permanent deletion, cannot be undone

---

#### **STEP 8: Update Admin Dashboard** (Non-Breaking)
**Goal**: Remove prebooking statistics if prebookings removed

1. **Modify `app/admin/page.tsx`**
   - Remove prebooking stats (if Option B)
   - Remove recent prebookings section (if Option B)
   - Keep if Option A (prebookings retained for events)

2. **Update Admin Navigation**
   - Remove prebooking links if removed

**Risk**: ⚠️ **LOW** - UI-only changes

---

#### **STEP 9: Clean Up Documentation** (Non-Breaking)
**Goal**: Update all documentation files

1. **Update `PROJECT_SUMMARY.md`**
   - Remove daily subscription sections
   - Update pricing formulas
   - Remove prebooking flow (if removed)

2. **Update `PROJECT_FUNCTIONALITIES.md`**
   - Remove daily subscription features
   - Update business logic sections

3. **Update `PROJECT_DESCRIPTION.md`**
   - Remove subscription references

**Risk**: ⚠️ **NONE** - Documentation only

---

### 3.2 Files to Delete (If Removing Prebookings Entirely)

| File Path | Reason |
|-----------|--------|
| `app/api/prebooking/route.ts` | Prebooking API endpoint |
| `app/api/prebooking/[id]/route.ts` | Prebooking CRUD endpoint |
| `hooks/usePrebookings.ts` | Prebooking React hooks |
| `app/prebooking/page.tsx` | **OR** Simplify to event-only if keeping prebookings |

---

### 3.3 Files to Modify

| File Path | Changes Required |
|-----------|-----------------|
| `prisma/schema.prisma` | Add deliveryFee, minimumOrder, subtotal, deliveryType |
| `app/api/orders/route.ts` | Update order creation with new pricing |
| `app/api/delivery-zones/validate/route.ts` | Return pricing info |
| `app/api/delivery-zones/check/route.ts` | Return pricing info |
| `app/checkout/page.tsx` | Remove prebookings, use new pricing |
| `app/cart/page.tsx` | Remove prebooking editing |
| `app/prebooking/page.tsx` | Remove daily subscription OR delete entirely |
| `components/BookingWidget.tsx` | Remove DAILY option |
| `components/BookingWidgetMobile.tsx` | Remove DAILY option |
| `app/admin/page.tsx` | Remove prebooking stats (if removed) |
| `hooks/useMeals.ts` | **DECISION**: Keep or remove `useDailyMeals()` |
| `utils/validators.ts` | Update order schema, remove prebooking if deleted |
| `context/CartContext.tsx` | Verify no prebooking references |

---

### 3.4 Order of Execution (Recommended)

```
1. ✅ Database Schema Updates (Step 1)
   └─ Non-breaking, can be deployed immediately

2. ✅ Delivery Zone API Updates (Step 2)
   └─ Non-breaking, backward compatible

3. ✅ Order API Updates (Step 3)
   └─ Breaking but isolated, test thoroughly

4. ✅ Remove Daily Subscription UI (Step 4)
   └─ Breaking but EVENT path remains

5. ✅ Simplify Cart (Step 5)
   └─ Breaking, test cart functionality

6. ✅ Simplify Checkout (Step 6)
   └─ HIGH RISK, extensive testing required

7. ⚠️ Remove Prebooking API (Step 7)
   └─ DECISION POINT: Keep or remove?

8. ✅ Update Admin (Step 8)
   └─ Low risk, UI only

9. ✅ Documentation (Step 9)
   └─ No risk
```

---

## 🎯 NEW TARGET BUSINESS LOGIC

### Event Catering Pricing Formula

```
Subtotal = sum(meal.price × quantity) for all items in cart
Delivery Fee = DeliveryZone.deliveryFee (if deliveryType === 'DELIVERY')
Total = Subtotal + Delivery Fee
```

### Checkout Rules

1. **Minimum Order Validation**
   ```
   IF deliveryType === 'DELIVERY' AND subtotal < DeliveryZone.minimumOrder:
     BLOCK checkout with error: "Minimum order is $X"
   ```

2. **Delivery Fee Application**
   ```
   IF deliveryType === 'DELIVERY':
     deliveryFee = DeliveryZone.deliveryFee
   ELSE:
     deliveryFee = 0
   ```

3. **Order Creation**
   ```
   Order {
     subtotal: calculated from cart items
     deliveryFee: from DeliveryZone or 0
     totalAmount: subtotal + deliveryFee
     deliveryType: 'DELIVERY' | 'PICKUP'
   }
   ```

---

## ⚠️ IMPORTANT CONSTRAINTS & DECISIONS

### Decision Points Requiring Your Input

1. **Prebooking Model**: 
   - ❓ **Keep for future event use** OR **Remove entirely**?
   - Recommendation: **Keep** (safer, allows future event prebooking feature)

2. **Meal Type Enum**:
   - ❓ Keep `DAILY` and `BOTH` for menu filtering OR remove?
   - Recommendation: **Keep** (useful for menu categorization)

3. **Daily Meals Hook**:
   - ❓ Keep `useDailyMeals()` for menu browsing OR remove?
   - Recommendation: **Keep** (menu still needs to show daily meals)

4. **Prebooking Page**:
   - ❓ Delete entirely OR simplify to event-only?
   - Recommendation: **Simplify** (if keeping prebookings for events)

### Constraints to Maintain

- ✅ **DO NOT** break Stripe integration
- ✅ **DO NOT** break authentication
- ✅ **DO NOT** delete database (migrations only)
- ✅ **DO NOT** break existing orders (backfill data)
- ✅ **DO** maintain backward compatibility where possible
- ✅ **DO** test each step before proceeding

---

## 📊 IMPACT SUMMARY

### Code Complexity Reduction

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Prebooking-related files | 8+ files | 0-4 files | 50-100% |
| Lines of subscription logic | ~500+ lines | 0 lines | 100% |
| Discount calculation locations | 2 locations | 0 locations | 100% |
| Pricing formulas | 3 different | 1 simple | 67% |
| Database models | 8 models | 7-8 models | 0-12.5% |

### Business Logic Simplification

- **Before**: Complex subscription pricing with weeks, days, discounts, guest multipliers
- **After**: Simple `price × quantity + deliveryFee`
- **Result**: Easier to understand, maintain, and scale

---

## ✅ NEXT STEPS

1. **Review this analysis report**
2. **Make decisions on Decision Points** (marked with ❓)
3. **Approve refactor plan**
4. **Begin Step 1** (Database schema updates)
5. **Test after each step**
6. **Deploy incrementally**

---

## 📝 NOTES

- This analysis is **comprehensive but not exhaustive**
- Some edge cases may be discovered during implementation
- All changes should be tested in a development environment first
- Consider creating a backup before Step 7 (Prebooking removal)

---

**Report Generated**: Complete  
**Status**: Ready for Review  
**Next Action**: Awaiting approval to proceed with Step 1
