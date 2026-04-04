# 🔍 Debugging 500 Error on /api/meals

## Current Issue
Getting `500 (Internal Server Error)` on `/api/meals` endpoint after migration.

## Steps to Debug

### 1. Check Server Terminal Output
The error logging in `app/api/meals/route.ts` should show detailed error information. Look at your **server terminal** (where `npm run dev` is running) and find the error message.

You should see something like:
```
Error fetching meals: [error details]
Full error details: { message: '...', code: '...', ... }
```

### 2. Common Causes & Solutions

#### A. Prisma Client Not Regenerated
**Symptom**: Error mentions "Unknown arg" or "column does not exist"

**Solution**:
```bash
# Stop dev server (Ctrl+C)
npm run db:generate
# Restart dev server
npm run dev
```

#### B. Database Connection Issue
**Symptom**: Error code `P1001` or "Can't reach database"

**Solution**:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker-compose up -d postgres

# Verify connection
npx prisma db execute --stdin
# Type: SELECT 1;
```

#### C. Migration Not Applied
**Symptom**: Error code `P2021` or "column does not exist"

**Solution**:
```bash
# Check migration status
npx prisma migrate status

# If pending, apply migrations
npx prisma migrate deploy
```

#### D. Schema Mismatch
**Symptom**: Prisma Client out of sync with database

**Solution**:
```bash
# Reset and regenerate
npm run db:generate

# If that doesn't work, reset everything (⚠️ deletes data)
npx prisma migrate reset
npm run db:seed
```

### 3. Quick Diagnostic Commands

Run these to check the state:

```bash
# 1. Check Prisma Client is generated
ls node_modules/.prisma/client

# 2. Check database connection
npx prisma db execute --stdin
# Type: SELECT 1;

# 3. Check if meals table exists
npx prisma db execute --stdin
# Type: SELECT COUNT(*) FROM meals;

# 4. Check migration status
npx prisma migrate status

# 5. View Prisma Studio to verify data
npx prisma studio
```

### 4. Check Browser Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Find the failed `/api/meals` request
4. Click on it
5. Check the **Response** tab for error details

### 5. Check Server Logs

Look at your terminal where `npm run dev` is running. The error should be logged there with full details.

---

## What to Share for Further Help

If the issue persists, please share:

1. **Server terminal output** - The full error message from the terminal
2. **Browser console error** - Any errors in the browser console
3. **Network tab response** - The response body from the failed `/api/meals` request
4. **Migration status** - Output of `npx prisma migrate status`
5. **Database connection** - Output of `npx prisma db execute --stdin` (with `SELECT 1;`)

---

## Most Likely Fix

Based on the symptoms, try this first:

```bash
# 1. Stop dev server completely
# Press Ctrl+C in the terminal

# 2. Regenerate Prisma Client
npm run db:generate

# 3. Verify it worked
ls node_modules/.prisma/client/index.js

# 4. Restart dev server
npm run dev
```

If that doesn't work, check the server terminal for the actual error message - it will tell us exactly what's wrong.
