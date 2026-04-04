# ⚡ Quick Fix for 500 Error

## The Problem
Prisma Client generation is failing because a file is locked (likely by the dev server).

## Solution (Choose One)

### Option 1: Use the PowerShell Script (Easiest)
```powershell
# Run this in PowerShell
.\fix-prisma-client.ps1
```

This script will:
- Stop all Node processes
- Remove old Prisma Client
- Regenerate Prisma Client
- Tell you if it worked

### Option 2: Manual Steps

**Step 1: Stop Everything**
1. Press `Ctrl+C` in ALL terminal windows
2. Close VS Code/Cursor completely
3. Wait 10 seconds

**Step 2: Open Fresh Terminal**
1. Open a NEW PowerShell/Command Prompt
2. Navigate to project: `cd C:\Users\felda\catering-app`

**Step 3: Force Stop Node (if needed)**
```powershell
# Kill all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Step 4: Remove Prisma Client**
```powershell
# Remove the locked files
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
```

**Step 5: Regenerate**
```bash
npm run db:generate
```

**Step 6: Verify**
```bash
# Should see: ✔ Generated Prisma Client
```

**Step 7: Start Dev Server**
```bash
npm run dev
```

---

## If Still Failing

### Nuclear Option: Restart Computer
Sometimes Windows file locks persist. Restart your computer, then:
```bash
npm run db:generate
npm run dev
```

### Alternative: Check What's Locking the File
```powershell
# Find what's using the file
Get-Process | Where-Object {$_.Path -like "*node*"}
```

---

## After Fixing Prisma Client

Once Prisma Client is regenerated, the 500 error should be resolved. If you still get errors:

1. **Check server terminal** - Look for the actual error message
2. **Check browser console** - See what the API response says
3. **Verify database is running**:
   ```bash
   docker ps | grep postgres
   ```

---

## Expected Result

After successful Prisma Client generation:
- ✅ No more 500 errors
- ✅ `/api/meals` returns meals list
- ✅ App loads normally
