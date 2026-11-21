# ==============================================================================
# "HÔM NAY ĂN GÌ?" - LOCAL DEV SERVER LAUNCHER
# Khởi động Next.js App Router trên cổng 3000
# ==============================================================================

$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Write-Host ">>> Đang khởi động 'Hôm nay ăn gì?' tại http://localhost:3000 ..." -ForegroundColor Cyan
& "C:\Program Files\nodejs\npm.cmd" run dev
