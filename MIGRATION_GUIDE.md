# 🚀 Database Migration Guide

**Status**: Ready to Migrate  
**Migration Name**: `remove_prebooking_add_order_types`

---

## ✅ Step 1: Schema Verification

### Order Model ✅
```prisma
model Order {
  orderType       OrderType     @default(STANDARD)  ✅
  isEventConfirmed Boolean      @default(false)     ✅
  subtotal        Float                            ✅
  deliveryFee     Float         @default(0)        ✅
  deliveryZone    DeliveryZoneType?                ✅
  deliveryType    DeliveryType  @default(DELIVERY) ✅
  // ... other fields
}
```

### DeliveryZone Model ✅
```prisma
model DeliveryZone {
  deliveryFee   Float    @default(0)  ✅
  minimumOrder  Float    @default(0)  ✅
  // ... other fields
}
```

### QuoteRequest Model ✅
```prisma
model QuoteRequest {
  id              String          @id @default(cuid())
  name            String          ✅
  email           String          ✅
  phone           String          ✅
  eventType       String          ✅
  estimatedGuests Int?            ✅
  preferredDate   DateTime?       ✅
  suburb          String          ✅
  budgetRange      String?        ✅
  message          String?        ✅
  status          QuoteStatus     @default(NEW) ✅
  // ... timestamps
}
```

### Enums ✅
- ✅ `OrderType`: STANDARD, EVENT
- ✅ `DeliveryZoneType`: ZONE_1, ZONE_2
- ✅ `QuoteStatus`: NEW, CONTACTED, CLOSED
- ✅ `DeliveryType`: DELIVERY, PICKUP

**Schema Status**: ✅ All required fields present and correct

---

## ⚠️ Step 2: Pre-Migration Checklist

Before running the migration, ensure:

- [ ] **Database Backup**: Create a backup of your PostgreSQL database
- [ ] **Environment Variables**: Verify `DATABASE_URL` is correct in `.env`
- [ ] **No Active Connections**: Stop the development server if running
- [ ] **Review Changes**: Understand that this will:
  - **DELETE** the `prebookings` table (all prebooking data will be lost)
  - **ADD** new columns to `orders` table
  - **ADD** new columns to `delivery_zones` table
  - **CREATE** new `quote_requests` table

---

## 🔄 Step 3: Run Migration

### Command
```bash
npx prisma migrate dev --name remove_prebooking_add_order_types
```

### What This Does
1. Creates a new migration file in `prisma/migrations/`
2. Generates SQL to:
   - Drop `prebookings` table
   - Add new columns to `orders` table
   - Add new columns to `delivery_zones` table
   - Create `quote_requests` table
3. Applies the migration to your database
4. Regenerates Prisma Client

### Expected Output
```
✔ Generated Prisma Client
✔ Created migration: remove_prebooking_add_order_types
✔ Applied migration: remove_prebooking_add_order_types
```

### If You See Errors
- **Foreign Key Constraint**: If prebookings table has foreign key constraints, they will be dropped automatically
- **Column Already Exists**: If columns already exist, Prisma will handle it
- **Connection Error**: Check your `DATABASE_URL` in `.env`

---

## 🌱 Step 4: Seed Delivery Zones

### Command
```bash
npx prisma db seed
```

### What This Does
- Creates/updates delivery zones with:
  - **Zone 1** (0-10km): $15 delivery fee
    - Punchbowl, Belfield, Campsie, Roselands, Revesby, Burwood, Hurlstone Park, Croydon, Strathfield, Concord
  - **Zone 2** (10-20km): $30 delivery fee
    - Inner West Fringe, Sydney CBD (City Centre, Central, Circular Quay)
- Sets minimum order to $90 for all zones

### Expected Output
```
✔ Created/updated X delivery zones (Zone 1: 10, Zone 2: 4)
```

### Verify Zones
After seeding, verify in Prisma Studio:
```bash
npx prisma studio
```

Navigate to `DeliveryZone` table and confirm:
- Zone 1 postcodes have `deliveryFee = 15`
- Zone 2 postcodes have `deliveryFee = 30`
- All zones have `minimumOrder = 90`

---

## 🧪 Step 5: Testing Checklist

### Customer Workflow Tests

#### Test 1: Standard Order ($90-$399)
- [ ] Add meals to cart totaling $90-$399
- [ ] Go to checkout
- [ ] Select "Standard Catering"
- [ ] Enter Zone 1 postcode (e.g., 2196 for Punchbowl)
- [ ] Verify delivery fee shows $15
- [ ] Select delivery date (2-4 days from today)
- [ ] Complete payment
- [ ] Verify order created with:
  - `orderType = STANDARD`
  - `subtotal = cart total`
  - `deliveryFee = 15`
  - `deliveryZone = ZONE_1`

#### Test 2: Standard Order Validation
- [ ] Try order < $90 → Should block with error
- [ ] Try order ≥ $400 → Should suggest Event type
- [ ] Try date < 2 days → Should block
- [ ] Try date > 4 days → Should block

#### Test 3: Event Order ($400+)
- [ ] Add meals to cart totaling $400+
- [ ] Go to checkout
- [ ] Verify "Event Catering" is auto-selected
- [ ] Check "I confirm this is an Event Catering order" checkbox
- [ ] Enter Zone 2 postcode (e.g., 2000 for Sydney CBD)
- [ ] Verify delivery fee shows $30
- [ ] Select delivery date (7+ days from today)
- [ ] Complete payment
- [ ] Verify order created with:
  - `orderType = EVENT`
  - `isEventConfirmed = true`
  - `subtotal = cart total`
  - `deliveryFee = 30`
  - `deliveryZone = ZONE_2`

#### Test 4: Event Order Validation
- [ ] Try order < $400 → Should block
- [ ] Try without confirmation checkbox → Should block
- [ ] Try date < 7 days → Should block

#### Test 5: Quote Request
- [ ] Add meals totaling ≥ $1,500
- [ ] Verify quote request prompt appears in cart
- [ ] Click "Request a Quote"
- [ ] Fill out quote request form
- [ ] Submit
- [ ] Verify quote request created in database

#### Test 6: Delivery Zone Validation
- [ ] Try postcode not in Zone 1 or Zone 2
- [ ] Should show error: "We do not currently deliver to your area"
- [ ] Try Zone 1 postcode → Should show $15 fee
- [ ] Try Zone 2 postcode → Should show $30 fee

### Admin Workflow Tests

#### Test 7: View Orders
- [ ] Login as admin
- [ ] Navigate to `/admin/orders`
- [ ] Verify orders show `orderType` (STANDARD/EVENT)
- [ ] Verify orders show `subtotal`, `deliveryFee`, `totalAmount`
- [ ] Verify orders show `deliveryZone` (ZONE_1/ZONE_2)

#### Test 8: View Quote Requests
- [ ] Navigate to `/admin/quotes` (or check API)
- [ ] Verify quote requests appear
- [ ] Verify status is NEW
- [ ] Test updating status (when UI is implemented)

#### Test 9: Delivery Zone Management
- [ ] Check delivery zones in database
- [ ] Verify Zone 1 has $15 fee
- [ ] Verify Zone 2 has $30 fee
- [ ] Verify all zones have $90 minimum order

---

## 🔍 Step 6: Verify Database State

### Check Orders Table
```sql
SELECT 
  id,
  "orderType",
  "isEventConfirmed",
  subtotal,
  "deliveryFee",
  "totalAmount",
  "deliveryZone",
  "deliveryType"
FROM orders
LIMIT 5;
```

Expected:
- `orderType` should be STANDARD or EVENT
- `isEventConfirmed` should be true for EVENT orders
- `subtotal` + `deliveryFee` = `totalAmount`
- `deliveryZone` should be ZONE_1 or ZONE_2 (or NULL for pickup)

### Check DeliveryZones Table
```sql
SELECT 
  postcode,
  suburb,
  "deliveryFee",
  "minimumOrder",
  "isActive"
FROM delivery_zones
ORDER BY "deliveryFee", postcode;
```

Expected:
- Zone 1 postcodes: `deliveryFee = 15`
- Zone 2 postcodes: `deliveryFee = 30`
- All zones: `minimumOrder = 90`

### Check QuoteRequests Table
```sql
SELECT 
  id,
  name,
  email,
  "eventType",
  status,
  "createdAt"
FROM quote_requests
ORDER BY "createdAt" DESC
LIMIT 5;
```

Expected:
- All quote requests should have status = NEW
- All required fields should be populated

### Verify Prebookings Removed
```sql
SELECT * FROM prebookings;
```

Expected:
- Should return error: "relation 'prebookings' does not exist"
- This confirms the table was successfully dropped

---

## 🐛 Troubleshooting

### Migration Fails: Foreign Key Constraint
**Error**: `Cannot drop table "prebookings" because other objects depend on it`

**Solution**: Prisma should handle this automatically, but if it doesn't:
1. Manually drop foreign key constraints first
2. Or use `--create-only` flag to review migration SQL first

### Migration Fails: Column Already Exists
**Error**: `Column "orderType" already exists`

**Solution**: 
- If columns already exist from previous migration, Prisma will handle it
- If you need to reset: `npx prisma migrate reset` (⚠️ deletes all data)

### Seed Fails: Duplicate Postcodes
**Error**: `Unique constraint violation`

**Solution**: Seed file uses `upsert` logic, should handle duplicates. If issues persist:
- Check seed file logic
- Manually verify postcodes in database

### Orders Missing New Fields
**Issue**: Existing orders have NULL for new fields

**Solution**: Run this SQL after migration:
```sql
UPDATE orders 
SET 
  subtotal = "totalAmount",
  "deliveryFee" = 0,
  "orderType" = 'STANDARD',
  "deliveryType" = 'DELIVERY'
WHERE subtotal IS NULL;
```

---

## ✅ Post-Migration Verification

After migration completes successfully:

- [ ] Prisma Client regenerated
- [ ] No migration errors
- [ ] Delivery zones seeded correctly
- [ ] Can create new orders
- [ ] Can view orders in admin panel
- [ ] Quote requests can be created
- [ ] All validation rules working

---

## 📝 Migration Summary

### Tables Dropped
- ❌ `prebookings` (all data lost)

### Tables Modified
- ✅ `orders` (added: orderType, isEventConfirmed, subtotal, deliveryFee, deliveryZone, deliveryType)
- ✅ `delivery_zones` (added: deliveryFee, minimumOrder)

### Tables Created
- ✅ `quote_requests` (new table)

### Enums Created
- ✅ `OrderType` (STANDARD, EVENT)
- ✅ `DeliveryZoneType` (ZONE_1, ZONE_2)
- ✅ `QuoteStatus` (NEW, CONTACTED, CLOSED)
- ✅ `DeliveryType` (DELIVERY, PICKUP)

---

## 🎯 Ready to Proceed?

If all checks pass, you're ready to run:

```bash
# 1. Run migration
npx prisma migrate dev --name remove_prebooking_add_order_types

# 2. Seed delivery zones
npx prisma db seed

# 3. Start development server
npm run dev
```

**Good luck!** 🚀
