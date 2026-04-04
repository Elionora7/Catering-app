# 🔧 Troubleshooting 500 Internal Server Error

## Problem
Getting `500 (Internal Server Error)` when testing the application.

## Root Cause
The Prisma Client hasn't been regenerated after the database migration. The code is trying to use new fields (`orderType`, `isEventConfirmed`, `deliveryZone`, etc.) that exist in the schema but the generated Prisma Client doesn't know about them yet.

## Solution Steps

### Step 1: Stop the Development Server
**Important**: The Prisma Client generation is failing because the dev server has a lock on the Prisma files.

1. **Stop the Next.js dev server** (press `Ctrl+C` in the terminal where it's running)
2. Wait a few seconds for file locks to release

### Step 2: Regenerate Prisma Client
After stopping the server, run:

```bash
npm run db:generate
```

**Expected Output**:
```
✔ Generated Prisma Client
```

### Step 3: Verify Migration Status
Check if the migration was applied:

```bash
npx prisma migrate status
```

**Expected Output**:
```
✔ Database schema is up to date
```

If it shows pending migrations, run:
```bash
npx prisma migrate deploy
```

### Step 4: Restart Development Server
```bash
npm run dev
```

---

## Alternative: If File Lock Persists

If you still get permission errors:

### Option 1: Close All Terminals
1. Close all terminal windows
2. Close VS Code/Cursor if it has terminals open
3. Wait 10 seconds
4. Open a fresh terminal
5. Run `npm run db:generate`

### Option 2: Delete and Regenerate
```bash
# Delete the generated Prisma Client
rm -rf node_modules/.prisma

# Regenerate
npm run db:generate
```

**Windows PowerShell**:
```powershell
Remove-Item -Recurse -Force node_modules\.prisma
npm run db:generate
```

### Option 3: Restart Computer
If all else fails, restart your computer to release all file locks.

---

## Verify the Fix

After regenerating Prisma Client, test these endpoints:

1. **GET /api/meals** - Should return meals list
2. **GET /api/orders** - Should return orders (if logged in)
3. **POST /api/orders** - Should create orders with new fields

Check the browser console and server logs for specific error messages.

---

## Common Error Messages

### Error: "Unknown arg `orderType` in data.orderType"
**Cause**: Prisma Client not regenerated  
**Fix**: Run `npm run db:generate`

### Error: "Column 'orderType' does not exist"
**Cause**: Migration not applied  
**Fix**: Run `npx prisma migrate deploy`

### Error: "EPERM: operation not permitted"
**Cause**: File lock (dev server running)  
**Fix**: Stop dev server, then regenerate

### Error: "P1001: Can't reach database"
**Cause**: Database not running  
**Fix**: Start PostgreSQL (Docker: `docker-compose up -d postgres`)

---

## Quick Diagnostic Commands

```bash
# 1. Check if database is running
docker ps | grep postgres

# 2. Check Prisma Client version
npx prisma --version

# 3. Check migration status
npx prisma migrate status

# 4. Test database connection
npx prisma db execute --stdin
# Then type: SELECT 1;

# 5. View Prisma Studio (to verify data)
npx prisma studio
```

---

## Still Having Issues?

If the error persists after following these steps:

1. **Check the server logs** - Look for the specific error message
2. **Check browser console** - Look for the failing API endpoint
3. **Verify environment variables** - Ensure `DATABASE_URL` is correct
4. **Check database connection** - Ensure PostgreSQL is running

Share the specific error message from:
- Server terminal output
- Browser console (F12 → Console tab)
- Network tab (F12 → Network → Failed request → Response)
