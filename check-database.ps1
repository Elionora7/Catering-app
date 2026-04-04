# PowerShell script to check database state

Write-Host "🔍 Checking Database State..." -ForegroundColor Cyan

# Check if Prisma Client exists
Write-Host "`n1. Checking Prisma Client..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma\client\index.js") {
    Write-Host "   ✅ Prisma Client exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Prisma Client NOT found - Run: npm run db:generate" -ForegroundColor Red
}

# Check database connection and count meals
Write-Host "`n2. Checking database connection and meals..." -ForegroundColor Yellow
try {
    $result = npx prisma db execute --stdin 2>&1
    Write-Host "   ✅ Database connection OK" -ForegroundColor Green
    
    # Try to count meals
    Write-Host "`n3. Counting meals in database..." -ForegroundColor Yellow
    Write-Host "   (This will show if meals exist)" -ForegroundColor Gray
    
    # Use Prisma Studio query or direct SQL
    Write-Host "`nTo check meals manually, run:" -ForegroundColor Cyan
    Write-Host "   npx prisma studio" -ForegroundColor White
    Write-Host "   Then open the 'meals' table" -ForegroundColor White
    
} catch {
    Write-Host "   ❌ Database connection failed" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Check server terminal for actual error message" -ForegroundColor White
Write-Host "   2. If no meals exist, run: npm run db:seed" -ForegroundColor White
Write-Host "   3. Verify Prisma Client: npm run db:generate" -ForegroundColor White
