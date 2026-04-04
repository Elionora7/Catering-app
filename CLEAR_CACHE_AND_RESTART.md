# 🔄 Clear Cache and Restart - Fix for 500 Error

## The Problem
The database connection works fine (we tested it and found 25 meals), but the Next.js API route is still returning 500 errors. This is likely a **caching issue** with Next.js or Prisma Client.

## Solution: Hard Reset

### Step 1: Stop Everything
1. **Stop the dev server** - Press `Ctrl+C` in the terminal where `npm run dev` is running
2. **Close all terminals** related to this project
3. **Wait 5 seconds** for processes to fully stop

### Step 2: Clear All Caches
Run these commands in PowerShell:

```powershell
# Clear Next.js cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Clear Prisma Client
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue

# Clear Node modules cache (optional, but thorough)
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
```

### Step 3: Regenerate Prisma Client
```bash
npm run db:generate
```

You should see:
```
✔ Generated Prisma Client
```

### Step 4: Restart Dev Server
```bash
npm run dev
```

### Step 5: Test
1. Open browser to `http://localhost:3000`
2. Check browser console - should see no 500 errors
3. Check server terminal - should see no errors

---

## Alternative: Test Endpoint

I've created a test endpoint at `/api/test-meals` that will help diagnose the issue.

1. After restarting, visit: `http://localhost:3000/api/test-meals`
2. This will show detailed error information if something is still wrong
3. Check the server terminal for detailed logs

---

## If Still Failing

If you still get 500 errors after clearing cache:

1. **Check server terminal** - Look for the actual error message
2. **Visit test endpoint** - `http://localhost:3000/api/test-meals` to see detailed error
3. **Share the error message** from the server terminal

The error message will tell us exactly what's wrong!

---

## Expected Result

After clearing cache and restarting:
- ✅ `/api/meals` returns 200 status
- ✅ Menu page loads with meals
- ✅ No 500 errors in browser console
- ✅ Server terminal shows no errors
