# Menu Update Summary

## Overview
This document summarizes the comprehensive menu update for Eliora Signature Catering, including all new menu items, pricing structures, and system enhancements.

## Database Schema Changes

### New Fields in Meal Model
- `pricingType`: Enum (`PER_ITEM`, `PER_DOZEN`, `PER_PERSON`, `PER_SKEWER`, `SIZED`)
- `priceSmall`: Optional Float (for SIZED items)
- `priceMedium`: Optional Float (for SIZED items)
- `priceLarge`: Optional Float (for SIZED items)
- `priceBainMarie`: Optional Float (for SIZED items)
- `minimumQuantity`: Optional Int (e.g., 12 for Paella, 12 for per-dozen items)

### New Fields in OrderItem Model
- `size`: Optional String (`SMALL`, `MEDIUM`, `LARGE`, `BAIN_MARIE`)
- `bainMarieFee`: Float (default 0) - Additional $55 per tray for Bain-Marie service

## Menu Categories & Items

### 1. Finger Food (Per Item) - 10 items
- Beef Mini Burger — $6.50
- Chicken Mini Burger — $6.50
- Crumbed Fish Mini Burger — $6.50
- Halloumi Turkish Bread — $5.50
- Salmon Mini Bagel — $6.50
- Mini Croissant — $5.50
- Mini Baguette — $5.50
- Chicken Mini Wrap — $6.00
- Falafel Mini Wrap — $5.00
- Halloumi Mini Wrap — $5.00

### 2. Finger Food (Per Dozen - 12 Pieces) - 10 items
- Kibbeh — $24
- Meat Sambousik — $22
- Cheese Sambousik — $20
- Pizza Supreme — $22
- Vegetarian Pizza — $20
- Cheese Pizza — $20
- Zaatar Pizza — $18
- Spinach Fatayer — $20
- Vegetable Spring Rolls — $18
- Falafel Platter — $18

### 3. Salads (Small / Medium / Large) - 8 items
- Tabouli — $45 / $55 / $65
- Fattoush — $45 / $55 / $65
- Greek Salad — $45 / $55 / $65
- Seafood Pasta Salad — $45 / $55 / $70
- Garden Salad — $45 / $55 / $65
- Mixed Bean Salad — $45 / $55 / $65
- Chicken Caesar Salad — $48 / $58 / $70
- Rocket Salad — $45 / $55 / $65

### 4. Dips (Medium / Large) - 4 items
- Hummus — $10 / $15
- Garlic Dip (Toum) — $10 / $15
- Eggplant Dip (Baba Ghanoush) — $10 / $15
- Tahini Dip — $10 / $15

### 5. Tray Sizes - 2 items
- Medium Tray — $35
- Large Tray — $55

### 6. Pasta & Noodle Platters (Small / Medium / Large / Bain-Marie) - 8 items
- Creamy Chicken Pasta — $45 / $65 / $85 / $140
- Bolognese Pasta — $45 / $65 / $85 / $140
- Lasagna — $45 / $65 / $85 / $140
- Pesto Chicken Penne — $45 / $65 / $85 / $140
- Penne Arrabbiata — $40 / $60 / $80 / $140
- Chicken & Vegetable Noodles — $45 / $65 / $85 / $140
- Beef & Vegetable Noodles — $45 / $65 / $85 / $140
- Prawn & Vegetable Noodles — $50 / $70 / $90 / $150

**Note**: Bain-Marie service adds $55 per tray fee.

### 7. BBQ (Per Skewer / Per Dozen) - 7 items
- Lamb Skewers — $8 per skewer
- Chicken Skewers (Shish Tawook) — $6 per skewer
- Kafta Skewers — $6 per skewer
- Chicken Wings — $18 per dozen (minimum 12)
- BBQ Mixed Grill Platter (Small) — $75
- BBQ Mixed Grill Platter (Medium) — $95
- BBQ Mixed Grill Platter (Large) — $125

### 8. Mediterranean Main Platters (Small / Medium / Large) - 8 items
- Kibbeh Naye — $50 / $70 / $90
- Oven Baked Kibbeh — $50 / $70 / $90
- Fish with Tahini (Samke Harra) — $60 / $80 / $100
- Riz a Djej (Chicken with Rice) — $60 / $80 / $100
- Mansaf Lamb with Rice — $65 / $85 / $110
- Vine Leaves with Lamb Chops — $70 / $90 / $110
- Kafta with Potatoes — $50 / $70 / $90
- Stuffed Lebanese Zucchini (Kousa) — $60 / $80 / $100

### 9. Paella (Per Person) - 1 item
- Paella — $26 per person (minimum 12 people)

### 10. Vegetarian Lebanese Platters (Small / Medium / Large) - 5 items
- Vine Leaves (Vegetarian) — $55 / $70 / $90
- Fried Rice — $50 / $60 / $80
- Lentils with Rice (Mujadara) — $50 / $60 / $80
- Baked Potatoes with Rice (Batata Harra) — $50 / $60 / $80
- Baked Vegetables — $50 / $60 / $80

### 11. Desserts (Per Item) - 4 items
- Granola (Muesli, Yogurt & Fruit) — $5.50
- Fruit Salad — $5.50
- Cheesecake — $6.50
- Strawberry Tart — $6.50

**Total: 67 menu items**

## Frontend Updates

### Components Updated
1. **MealCard** (`components/MealCard.tsx`)
   - Added size selector dropdown for SIZED items
   - Displays price based on selected size
   - Shows Bain-Marie fee information
   - Displays minimum quantity requirements

2. **CartContext** (`context/CartContext.tsx`)
   - Added `size` and `bainMarieFee` to CartItem interface
   - Updated `addItem` to accept size parameter
   - Added `updateItemSize` function
   - Updated price calculation to handle size-based pricing and Bain-Marie fees

3. **Cart Page** (`app/cart/page.tsx`)
   - Displays size information for cart items
   - Shows correct prices based on size
   - Calculates subtotal including Bain-Marie fees

4. **Checkout Page** (`app/checkout/page.tsx`)
   - Sends size information when creating orders
   - Includes Bain-Marie fees in order data
   - Updates email confirmation with correct prices

### Hooks Updated
1. **useMeals** (`hooks/useMeals.ts`)
   - Updated Meal interface to include new pricing fields

2. **useOrders** (`hooks/useOrders.ts`)
   - Updated OrderItem interface to include size and bainMarieFee
   - Updated useCreateOrder to accept size information

## Backend Updates

### API Endpoints
1. **Orders API** (`app/api/orders/route.ts`)
   - Calculates prices based on size for SIZED items
   - Adds Bain-Marie fees per tray
   - Validates minimum quantity requirements
   - Stores size and bainMarieFee in OrderItem records

2. **Meals API** (`app/api/meals/route.ts` & `app/api/meals/[id]/route.ts`)
   - Supports creating/updating meals with new pricing fields
   - Handles pricingType, size prices, and minimumQuantity

### Validation
- Updated `orderItemSchema` to include `size` and `bainMarieFee`
- Updated `mealSchema` to include new pricing fields
- Server-side validation for minimum quantities

## Pricing Rules

### Size-Based Pricing
- **SIZED items**: Price varies by size (Small/Medium/Large/Bain-Marie)
- **Bain-Marie service**: Adds $55 per tray fee
- **Per-dozen items**: Minimum order of 12 pieces
- **Per-person items**: Minimum order of 12 people (Paella)

### Delivery Zones
- **Zone 1**: $15 delivery fee (Core areas)
- **Zone 2**: $30 delivery fee (Extended areas)
- **Zone 3**: $40 delivery fee (Premium locations)

### Order Type Rules
- **Standard Orders**: $90-$399, 2-4 days notice
- **Event Orders**: $400+, 7+ days notice

## Migration Instructions

### Step 1: Generate Prisma Client
```bash
npx prisma generate
```

### Step 2: Create and Run Migration
```bash
npx prisma migrate dev --name add_meal_sizes_and_pricing_types
```

### Step 3: Seed Database
```bash
npm run db:seed
# or
npx prisma db seed
```

This will:
- Clear existing meals
- Create all 67 new menu items with correct pricing
- Set up delivery zones (Zone 1, 2, 3)

### Step 4: Verify
1. Check menu page displays all items
2. Test size selection for SIZED items
3. Verify prices calculate correctly in cart
4. Test checkout with different sizes
5. Confirm Bain-Marie fees are added correctly

## Testing Checklist

- [ ] Menu page displays all 67 items
- [ ] Size selector appears for SIZED items
- [ ] Prices update based on size selection
- [ ] Bain-Marie fee ($55/tray) is added correctly
- [ ] Minimum quantity validation works (Paella, per-dozen items)
- [ ] Cart shows correct prices with sizes
- [ ] Checkout calculates subtotal correctly
- [ ] Orders are created with size information
- [ ] Delivery fees apply correctly (Zone 1, 2, 3)
- [ ] Admin can view all meals

## Notes

- All existing functionality remains intact
- Authentication and security unchanged
- Delivery zone logic unchanged
- Order type validation unchanged
- Admin CRUD supports new fields (via API)
- Seed file includes all dietary/allergy information where applicable

## Next Steps (Optional)

1. Update admin forms to include size pricing fields (currently handled via API)
2. Add bulk import functionality for menu items
3. Add image uploads for menu items
4. Enhance menu filtering by pricing type
