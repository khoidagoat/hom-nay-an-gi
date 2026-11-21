@echo off
chcp 65001 > nul
echo ==================================================================
echo   DỰ ÁN: "HÔM NAY ĂN GÌ?" - TOÀN TRÌNH DATA PIPELINE TỰ ĐỘNG
echo ==================================================================
echo [1/3] Trích xuất quán ăn TP.HCM từ Overture Maps GeoParquet (AWS S3)...
python scripts/data-pipeline/01_extract_overture.py --limit 500
if %ERRORLEVEL% NEQ 0 (
    echo [X] Lỗi ở Bước 1. Dừng tiến trình.
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Làm giàu dữ liệu bằng AI & Heuristics tiếng Việt...
python scripts/data-pipeline/02_enrich_with_ai.py --heuristic
if %ERRORLEVEL% NEQ 0 (
    echo [X] Lỗi ở Bước 2. Dừng tiến trình.
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Xuất file SQL, TypeScript mock và nạp dữ liệu vào Supabase Database...
python scripts/data-pipeline/03_seed_supabase.py --export-sql --export-ts
python scripts/data-pipeline/03_seed_supabase.py

echo.
echo ==================================================================
echo [✓] DATA PIPELINE ĐÃ HOÀN TẤT THÀNH CÔNG!
echo ==================================================================
pause
