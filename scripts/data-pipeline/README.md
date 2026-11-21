# DATA PIPELINE: NẠP DỮ LIỆU QUÁN ĂN TP.HCM (0 ĐỒNG CHI PHÍ)

Bộ pipeline tự động trích xuất, làm giàu dữ liệu và nạp hàng trăm quán ăn TP.HCM vào cơ sở dữ liệu Supabase phục vụ ứng dụng **"Hôm nay ăn gì?"**, đảm bảo:
- **0 đồng chi phí vận hành:** Đọc trực tiếp GeoParquet công khai trên AWS S3 của Overture Maps Foundation bằng DuckDB (không tốn tiền API Google Places).
- **Idempotent (Chạy nhiều lần không trùng):** Sử dụng `overture_id` duy nhất làm khóa `ON CONFLICT DO UPDATE`.
- **An toàn & Linh hoạt:** Hỗ trợ `--dry-run` cho cả 3 bước để kiểm tra trước mà không tốn token AI hay ghi database.

---

## 1. KIẾN TRÚC PIPELINE 3 BƯỚC

```
[Overture Maps S3 GeoParquet]
         │
         ▼ (Bước 1: DuckDB + Spatial + HTTPFS)
[data/hcmc_raw.json] (~500 quán ăn nội thành TP.HCM, confidence >= 0.80)
         │
         ▼ (Bước 2: Gemini 2.5 Flash Batching 20 quán/request)
[data/hcmc_enriched.json] (Phân loại món, vibe, máy lạnh, ô tô, lý do gợi ý)
         │
         ▼ (Bước 3: Supabase Batch Upsert + Unsplash Food Photos 4:3)
[Supabase: restaurants Table] (PostgreSQL + PostGIS Geography Point)
```

---

## 2. CÀI ĐẶT MÔI TRƯỜNG

Mở terminal tại thư mục gốc dự án hoặc thư mục `scripts/data-pipeline`:

```bash
cd scripts/data-pipeline

# Cài đặt các thư viện cần thiết
pip install -r requirements.txt
```

### Cấu hình biến môi trường (`.env.local` hoặc `.env`)
Tạo file `.env.local` tại thư mục gốc hoặc file `.env` tại `scripts/data-pipeline/` (tham khảo file mẫu `.env.example`):

```ini
# Google Gemini API (Model: gemini-2.5-flash - Miễn phí tại aistudio.google.com)
GEMINI_API_KEY=AIzaSy...

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh... (hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

> **Lưu ý về Database Migration:** Hãy chắc chắn bạn đã chạy file migration `supabase/migrations/20241119000000_init_schema.sql` (hoặc `20241119000001_add_pipeline_columns.sql`) trong **Supabase SQL Editor** trước khi nạp dữ liệu.

---

## 3. HƯỚNG DẪN THỰC THI CHI TIẾT

### BƯỚC 1: Trích xuất quán ăn từ Overture Maps (`01_extract_overture.py`)
Script tự động đọc STAC Catalog để lấy bản release mới nhất, lọc Bounding Box trung tâm TP.HCM (`106.60 <= lng <= 106.82`, `10.70 <= lat <= 10.87`), nhóm ăn uống và loại bỏ tạp hóa/spa/cafe thuần.

```bash
# Chạy thử nghiệm cú pháp (Dry run)
python 01_extract_overture.py --dry-run

# Chạy thực tế lấy 500 quán chất lượng nhất (Khuyên dùng)
python 01_extract_overture.py --limit 500

# Hoặc lấy tất cả quán thỏa mãn điều kiện
python 01_extract_overture.py --limit all
```
*Kết quả sẽ được lưu tại:* `scripts/data-pipeline/data/hcmc_raw.json`

---

### BƯỚC 2: Làm giàu dữ liệu bằng AI (`02_enrich_with_ai.py`)
Script gửi từng lô 20 quán đến `gemini-2.5-flash` kèm Structured JSON Output để:
- Lọc bỏ địa điểm rác (`is_valid_eatery: false`).
- Chuẩn hóa nhóm món: `Cơm`, `Bún/Phở`, `Lẩu/Nướng`, `Đồ Nhật/Hàn`, `Đồ Âu`, `Ăn vặt`, `Món Việt khác`.
- Gán `sub_cuisine` để map ảnh minh họa chuẩn xác.
- Đánh giá bảo thủ `has_ac` (máy lạnh), `has_car_parking` (đỗ ô tô), `free_moto_parking` (xe máy).
- Viết câu gợi ý ngắn gọn (`short_reason`) vui vẻ, tự nhiên.
- **Tự động lưu Checkpoint:** Cho phép dừng lại bất kỳ lúc nào và chạy tiếp mà không bị tốn lại token của quán đã xử lý.

```bash
# Chạy thử nghiệm mock test không gọi API tốn token
python 02_enrich_with_ai.py --dry-run

# Chạy thực tế làm giàu dữ liệu với Gemini
python 02_enrich_with_ai.py --batch-size 20 --delay 2.0
```
*Kết quả sẽ được lưu liên tục tại:* `scripts/data-pipeline/data/hcmc_enriched.json`

---

### BƯỚC 3: Nạp vào Database Supabase (`03_seed_supabase.py`)
Script đọc `hcmc_enriched.json`, lọc bỏ quán không hợp lệ, gán ảnh minh họa chuẩn từng món (`sub_cuisine`), và batch upsert 50 quán/lần vào Supabase:

#### Danh mục ảnh món ăn chuẩn hóa (`public/images/food/{sub_cuisine}.webp`):
Pipeline ưu tiên dùng ảnh local tốc độ cao tại `public/images/food/`. Nếu chưa có file local, script sẽ tự động fallback sang ảnh online Unsplash HD được tuyển chọn kỹ lưỡng:
1. `com_tam.webp` — Cơm tấm sườn bì chả
2. `com_van_phong.webp` — Cơm văn phòng, cơm niêu, cơm gà
3. `pho.webp` — Phở bò tái nạm, phở gà
4. `bun_bo.webp` — Bún bò Huế, bún riêu, bún chả
5. `bun_dau.webp` — Mẹt bún đậu mắm tôm thập cẩm
6. `hu_tieu.webp` — Hủ tiếu Nam Vang, mì sườn, bánh canh
7. `banh_mi.webp` — Bánh mì thịt chả pate, bánh mì chảo
8. `lau.webp` — Lẩu bò sa tế, lẩu Thái hải sản, lẩu gà
9. `nuong_bbq.webp` — Thịt nướng than hoa, bò né nướng ngói
10. `sushi_ramen.webp` — Sushi cá hồi, ramen Nhật Bản
11. `do_han.webp` — Tokbokki phô mai cay, gà rán sốt cay, bibimbap
12. `pizza_pasta.webp` — Pizza lò củi, mì Ý pasta, steak bò Âu
13. `an_vat.webp` — Bánh tráng nướng, bánh xèo giòn, ăn vặt Sài Gòn
14. `oc_hai_san.webp` — Ốc hương xào bơ tỏi, sò nướng mỡ hành, hải sản
15. `khac.webp` — Mâm cơm Việt đặc sản khác

```bash
# Chạy thử nghiệm xem trước 3 quán mẫu và xuất file SQL
python 03_seed_supabase.py --dry-run

# Xuất toàn bộ câu lệnh INSERT/UPSERT ra file SQL (để chạy trong Supabase SQL Editor nếu muốn)
python 03_seed_supabase.py --export-sql

# Nạp trực tiếp vào Supabase Database qua API Client
python 03_seed_supabase.py --batch-size 50
```
*File SQL dự phòng (nếu dùng cờ `--export-sql`):* `scripts/data-pipeline/data/seed_overture.sql`

---

## 4. XỬ LÝ LỖI THƯỜNG GẶP (TROUBLESHOOTING)

1. **Lỗi DuckDB Extension trên Windows:**
   - Script đã được cấu hình lưu extension cục bộ tại thư mục `.duckdb_extensions/` để tránh lỗi phân quyền `Access Denied` ở thư mục người dùng.
2. **Quá giới hạn Gemini API (Rate Limit 429):**
   - Tài khoản Gemini Free Tier có giới hạn 15 RPM (Request Per Minute). Script mặc định để `--delay 2.0` (2 giây giữa các batch). Nếu gặp lỗi, tăng `--delay 4.0` hoặc `--batch-size 15`. Cơ chế Checkpoint sẽ đảm bảo bạn không bị mất dữ liệu đã làm.
3. **Không có Service Role Key Supabase:**
   - Dùng lệnh `python 03_seed_supabase.py --export-sql` để tạo file `data/seed_overture.sql`. Sau đó mở [Supabase Dashboard](https://app.supabase.com) -> SQL Editor -> Dán toàn bộ nội dung file SQL và bấm **Run**.
