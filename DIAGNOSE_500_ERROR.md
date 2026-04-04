# 🔍 Diagnosing 500 Error on /api/meals

## Critical: Check Server Terminal First!

The **most important** step is to look at your **server terminal** (where `npm run dev` is running). The error logging in the meals API will show the exact problem.

Look for lines like:
```
Error fetching meals: [error message]
Full error details: { message: '...', code: '...' }
```

## Common Causes & Solutions

### 1. Database Not Seeded (No Meals Data)

**Symptom**: Database is empty, no meals exist

**Check**:
```bash
# Open Prisma Studio to see data
npx prisma studio
# Navigate to "meals" table - is it empty?
```

**Fix**:
```bash
npm run db:seed
```

This will create sample meals in your database.

### 2. Prisma Client Not Generated

**Symptom**: Error mentions "Unknown arg" or Prisma client issues

**Check**:
```bash
# Verify Prisma Client exists
ls node_modules/.prisma/client/index.js
```

**Fix**:
```bash
npm run db:generate
```

### 3. Database Connection Failed

**Symptom**: Error code `P1001` or "Can't reach database"

**Check**:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres
```

**Fix**:
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Or if using local PostgreSQL, start the service
```

### 4. Migration Not Applied

**Symptom**: Error code `P2021` or "column does not exist"

**Check**:
```bash
npx prisma migrate status
```

**Fix**:
```bash
npx prisma migrate deploy
```

## Quick Diagnostic Steps

Run these commands in order:

```bash
# 1. Check Prisma Client
npm run db:generate

# 2. Check database connection
npx prisma db execute --stdin
# Type: SELECT 1;

# 3. Check if meals table exists and has data
npx prisma studio
# Open browser, check "meals" table

# 4. If meals table is empty, seed the database
npm run db:seed

# 5. Restart dev server
npm run dev
```

## Most Likely Issue: Database Not Seeded

After the migration, your database might be empty. The seed script creates:
- Admin user (admin@catering.com / admin123)
- Customer user (customer@example.com / customer123)
- Sample meals (10+ meals)
- Delivery zones

**To seed the database:**
```bash
npm run db:seed
```

You should see:
```
🌱 Starting seed...
✔ Created users
✔ Created 10 meals
✔ Created/updated X delivery zones
🌱 Seed completed!
```

## After Seeding

1. Restart your dev server
2. Refresh your browser
3. The `/api/meals` endpoint should now return meals data
4. The menu page should load properly

---

## Still Getting 500 Error?

If you've:
- ✅ Regenerated Prisma Client
- ✅ Seeded the database
- ✅ Verified database connection
- ✅ Restarted dev server

Then **check your server terminal** for the actual error message. The meals API has detailed error logging that will tell us exactly what's wrong.

Share the error message from the server terminal, and I can help fix it!
