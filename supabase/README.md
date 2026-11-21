# HƯỚNG DẪN THIẾT LẬP SUPABASE DATABASE (COMBO 0 ĐỒNG)

Dự án sử dụng Supabase PostgreSQL kết hợp tiện ích **PostGIS** để tính toán bán kính không gian cực nhanh mà **không tốn một xu phí API Google Places**.

---

## CÁCH 1: THỰC THI TRỰC TIẾP TRÊN DASHBOARD SUPABASE (NHANH NHẤT - 1 PHÚT)

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com) và tạo một Project mới (hoàn toàn miễn phí).
2. Vào mục **SQL Editor** ở thanh menu bên trái.
3. Mở file [20241119000000_init_schema.sql](file:///d:/H%C3%B4m%20nay%20%C4%83n%20g%C3%AC/supabase/migrations/20241119000000_init_schema.sql), sao chép toàn bộ nội dung, dán vào SQL Editor và nhấn **RUN**.
   - Thao tác này sẽ bật PostGIS, tạo các bảng `restaurants`, `voting_rooms`, `room_votes`, các trigger đồng bộ tọa độ, các hàm RPC `get_nearby_restaurants`, `get_room_voting_results`, chính sách RLS bảo mật và bật Supabase Realtime.
4. Mở file [seed.sql](file:///d:/H%C3%B4m%20nay%20%C4%83n%20g%C3%AC/supabase/seed.sql), sao chép toàn bộ nội dung, dán vào SQL Editor và nhấn **RUN**.
   - Thao tác này sẽ nạp ngay **25 quán ăn thực tế nổi tiếng tại Q1, Q3, Bình Thạnh** kèm tọa độ GPS thật và ảnh minh họa sống động.
5. Vào **Project Settings -> API**:
   - Sao chép **Project URL** và **anon public key**.
   - Tạo file `.env.local` ở thư mục gốc của dự án và dán vào:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     NEXT_PUBLIC_APP_URL=http://localhost:3000
     ```

---

## CÁCH 2: DÙNG SUPABASE CLI (NẾU ĐÃ CÀI ĐẶT CLI)

```bash
# Đăng nhập Supabase
supabase login

# Liên kết với project Supabase
supabase link --project-ref your-project-id

# Đẩy migration lên database
supabase db push

# Nạp seed data
psql -h db.your-project-id.supabase.co -U postgres -d postgres -f supabase/seed.sql
```

---

## CÁC TÍNH NĂNG DATABASE NỔI BẬT ĐÃ ĐƯỢC THIẾT LẬP:
- **`postgis` Extension:** Cho phép dùng hàm `ST_DWithin` và `ST_Distance` trên kiểu dữ liệu `geography(Point, 4326)` để tìm quán chính xác từng mét.
- **Trigger `sync_restaurant_location`:** Tự động tạo và cập nhật điểm PostGIS geography mỗi khi thêm hoặc sửa `lat`, `lng`.
- **RPC `get_nearby_restaurants`:** Hàm tìm kiếm thông minh gom tất cả điều kiện: bán kính, vibe, máy lạnh, bãi đậu ô tô, mức giá, và tự động loại trừ các quán đã ăn gần đây (`exclude_ids`).
- **Supabase Realtime Publication:** Kích hoạt đồng bộ thời gian thực cho `voting_rooms` và `room_votes` phục vụ tính năng Chốt kèo nhóm.
