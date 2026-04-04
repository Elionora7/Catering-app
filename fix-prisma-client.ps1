# PowerShell script to fix Prisma Client generation issues on Windows

Write-Host "🔧 Fixing Prisma Client Generation..." -ForegroundColor Cyan

# Step 1: Stop all Node processes
Write-Host "`n1. Stopping all Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "   ✓ Stopped $($nodeProcesses.Count) Node process(es)" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ✓ No Node processes running" -ForegroundColor Green
}

# Step 2: Remove Prisma Client directory
Write-Host "`n2. Removing old Prisma Client..." -ForegroundColor Yellow
$prismaClientPath = "node_modules\.prisma"
if (Test-Path $prismaClientPath) {
    Remove-Item -Recurse -Force $prismaClientPath -ErrorAction SilentlyContinue
    Write-Host "   ✓ Removed Prisma Client directory" -ForegroundColor Green
} else {
    Write-Host "   ✓ Prisma Client directory doesn't exist" -ForegroundColor Green
}

# Step 3: Wait a moment
Write-Host "`n3. Waiting for file locks to release..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Step 4: Regenerate Prisma Client
Write-Host "`n4. Regenerating Prisma Client..." -ForegroundColor Yellow
npm run db:generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Prisma Client regenerated successfully!" -ForegroundColor Green
    Write-Host "`nYou can now start the dev server with: npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Prisma Client generation failed!" -ForegroundColor Red
    Write-Host "`nTry these steps:" -ForegroundColor Yellow
    Write-Host "   1. Close all terminals and VS Code/Cursor" -ForegroundColor White
    Write-Host "   2. Wait 10 seconds" -ForegroundColor White
    Write-Host "   3. Open a fresh terminal and run: npm run db:generate" -ForegroundColor White
    Write-Host "   4. If still failing, restart your computer" -ForegroundColor White
}
