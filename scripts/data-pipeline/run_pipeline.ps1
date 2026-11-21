# UTF-8 Encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  DỰ ÁN: 'HÔM NAY ĂN GÌ?' - TOÀN TRÌNH DATA PIPELINE TỰ ĐỘNG" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Trích xuất
Write-Host "`n[1/3] Trích xuất quán ăn TP.HCM từ Overture Maps GeoParquet (AWS S3)..." -ForegroundColor Yellow
python scripts/data-pipeline/01_extract_overture.py --limit 500
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Lỗi ở Bước 1. Dừng tiến trình." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 2. Làm giàu
Write-Host "`n[2/3] Làm giàu dữ liệu bằng AI & Heuristics tiếng Việt..." -ForegroundColor Yellow
python scripts/data-pipeline/02_enrich_with_ai.py --heuristic
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Lỗi ở Bước 2. Dừng tiến trình." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 3. Nạp Supabase
Write-Host "`n[3/3] Xuất file SQL, TypeScript mock và nạp dữ liệu vào Supabase Database..." -ForegroundColor Yellow
python scripts/data-pipeline/03_seed_supabase.py --export-sql --export-ts
python scripts/data-pipeline/03_seed_supabase.py

Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host "[✓] DATA PIPELINE ĐÃ HOÀN TẤT THÀNH CÔNG!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
