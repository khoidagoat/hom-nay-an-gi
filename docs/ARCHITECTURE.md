# KIẾN TRÚC DỰ ÁN "HÔM NAY ĂN GÌ?" (WEB APP / PWA)

## 1. TỔNG QUAN HỆ THỐNG
- **Tên dự án:** Hôm nay ăn gì?
- **Mục tiêu:** Giải quyết Decision Fatigue (lười suy nghĩ ăn gì) và hỗ trợ chốt kèo nhóm ăn trưa/tối trong 60 giây.
- **Triết lý sản phẩm:**
  - **0 đồng chi phí vận hành:** Tự chủ database với Supabase (PostgreSQL + PostGIS), điều hướng qua Google Maps Deep Link URL, không dùng Google Places API trả phí.
  - **Zero Friction (Không ma sát):** 100% không cần đăng ký / đăng nhập tài khoản. Lưu lịch sử 7 ngày qua `localStorage`.
  - **Mobile-first Tactile Experience:** Phù hợp thao tác 1 tay trên điện thoại, hiệu ứng xúc giác (Tactile buttons, Polaroid card, Thermal receipt kết quả).

---

## 2. KIẾN TRÚC THƯ MỤC DỰ ÁN (FOLDER STRUCTURE)

```
d:\Hôm nay ăn gì
├── .env.example                     # Mẫu biến môi trường (Supabase URL, Anon Key, App URL)
├── docs/                            # Tài liệu kiến trúc & hướng dẫn
│   └── ARCHITECTURE.md              # Toàn bộ thiết kế hệ thống, tokens, roadmap
├── supabase/                        # Database migrations & seeds (0đ vận hành)
│   ├── migrations/
│   │   └── 20241119000000_init_schema.sql  # Schema, PostGIS RPC functions, RLS & Realtime
│   └── seed.sql                     # 25 quán ăn thực tế Q1, Q3, Bình Thạnh kèm tọa độ thật
├── types/                           # TypeScript definitions
│   ├── database.ts                  # Type Supabase sinh tự động từ schema
│   └── index.ts                     # Domain types (Vibe, Restaurant, Filter, Room, Vote)
├── lib/                             # Core utilities & configurations
│   ├── supabase/
│   │   ├── client.ts                # Supabase browser client (Realtime enabled)
│   │   └── server.ts                # Server helper (khi cần SSR / Route Handlers)
│   ├── constants/
│   │   ├── vibes.ts                 # 5 thẻ Vibe ngữ cảnh + tọa độ fallback
│   │   └── cuisines.ts              # Danh mục ẩm thực & các tùy chọn lọc
│   └── utils/
│       ├── maps.ts                  # Google Maps Deep Link URL & khoảng cách
│       └── storage.ts               # LocalStorage lịch sử ăn uống 7 ngày
├── components/                      # UI Components theo Design System "Modern Bistro"
│   ├── common/
│   │   ├── BottomNav.tsx            # Thanh điều hướng đáy (3 tabs)
│   │   ├── Header.tsx               # Header nhận diện thương hiệu + chọn vị trí GPS
│   │   ├── LocationSelector.tsx     # Modal/Drawer chọn vị trí (GPS hoặc mẫu Q1, Q3)
│   │   └── TactileButton.tsx        # Nút bấm phong cách Tactile (viền 1.5px, đổ bóng cứng)
│   ├── solo/
│   │   ├── VibeGrid.tsx             # 5 thẻ Vibe 1-chạm
│   │   ├── AdvancedFilterDrawer.tsx # Bộ lọc nâng cao (bán kính, món nước/khô, giá)
│   │   ├── RestaurantCard.tsx       # Thẻ quán ăn phong cách Polaroid
│   │   └── ActionModals.tsx         # Modal xác nhận "Chốt quán này!" (Google Maps, Grab copy)
│   ├── group/
│   │   ├── CreateRoomModal.tsx      # Host tạo phòng (chọn bán kính, vibe)
│   │   ├── RoomLobby.tsx            # Sảnh chờ hiển thị room_code 6 ký tự + nút copy link Zalo
│   │   ├── TinderSwipeDeck.tsx      # Bộ thẻ quẹt trái / quẹt phải mượt mà (Framer Motion)
│   │   └── ThermalReceiptResult.tsx # Màn hình kết quả phong cách Hóa Đơn Nhiệt + Pháo giấy
│   └── contribute/
│       ├── ContributeForm.tsx       # Form ngắn góp quán ruột
│       └── LeafletPinPicker.tsx     # Bản đồ miễn phí ghim tọa độ quán
├── app/                             # Next.js 14+ App Router
│   ├── layout.tsx                   # Font imports (Bricolage Grotesque, Be Vietnam Pro, JetBrains Mono)
│   ├── page.tsx                     # Trang chính (Solo Mode - 1 chạm gợi ý quán)
│   ├── group/
│   │   ├── page.tsx                 # Trang tạo phòng / nhập mã phòng
│   │   └── [code]/
│   │       └── page.tsx             # Phòng vote realtime (Quẹt Tinder & Kết quả)
│   ├── contribute/
│   │   └── page.tsx                 # Trang góp quán tủ
│   ├── history/
│   │   └── page.tsx                 # Trang xem lịch sử các quán đã ăn gần đây
│   └── manifest.ts                  # Cấu hình PWA Web App Manifest
├── public/                          # Static assets, icons, sound effects
│   ├── icons/                       # PWA icons (192x192, 512x512)
│   └── sound/                       # Âm thanh vui nhộn (ding, swipe, cheer)
├── tailwind.config.ts               # Color tokens & typography theo Modern Bistro
└── package.json                     # Dependencies
```

---

## 3. DESIGN SYSTEM & UI/UX TOKENS ("MODERN BISTRO / WARM TACTILE")

### 3.1. Bảng màu (Color Palette)
- **Background chính:** `#FAF7F2` (Warm Cream Paper - êm dịu cho mắt, không dùng trắng tinh)
- **Border / Divider:** `#E6DFD3` (Màu vỏ trứng nhạt)
- **Primary Ink / Viền tương tác:** `#1C1917` (Warm Charcoal - nét mực ấm, không dùng đen tuyền)
- **Primary CTA:** `#E84A27` (Sriracha Orange-Red - kích thích cảm giác đói bụng)
- **Secondary / Match Green:** `#2A7B56` (Fresh Herb Green - tươi mới, thành công)
- **Highlight Badge:** `#F4B942` (Mustard Yellow - thẻ tag sticker)
- **Text Muted:** `#6B655E` (Xám ấm)

### 3.2. Typography (Google Fonts - 100% tiếng Việt)
- **Headings & Display:** `Bricolage Grotesque` (700 / 800, tracking -0.02em, cá tính mạnh mẽ)
- **Body & UI text:** `Be Vietnam Pro` (400 / 500 / 600, tối ưu hiển thị tiếng Việt trên màn hình nhỏ)
- **Numbers / Price / Distance / Room Code:** `JetBrains Mono` (Hiển thị số tiền, khoảng cách `850m`, mã phòng `#K3O8A9` sắc nét)

### 3.3. Quy tắc Micro-Interactions
- **Tactile Button:** Bo góc `rounded-xl`, viền `1.5px solid #1C1917`, bóng đổ cứng `shadow-[3px_3px_0px_#1C1917]`. Khi nhấn: `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`.
- **Thẻ quán Polaroid:** Tỉ lệ ảnh 4:3 chiếm 58% diện tích, góc ảnh có 2 sticker đè nhẹ (khoảng cách & giá).
- **Hóa đơn nhiệt (Thermal Receipt):** Đường đứt đoạn `border-dashed border-[#1C1917]/30`, chân răng cưa, font monospace in kết quả chốt kèo nhóm.

---

## 4. CHI TIẾT CƠ SỞ DỮ LIỆU & POSTGIS

### 4.1. Bảng `restaurants`
- Lưu trữ danh sách quán kèm cột `location` kiểu `geography(Point, 4326)`.
- Trigger `sync_restaurant_location()` tự động tính `location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography` mỗi khi cập nhật `lat, lng`.
- Chỉ mục không gian `GIST(location)` đảm bảo truy vấn hàng chục nghìn quán trong bán kính 5km chỉ mất < 5ms.

### 4.2. Hàm RPC `get_nearby_restaurants`
```sql
SELECT * FROM get_nearby_restaurants(
    user_lat := 10.779785,
    user_lng := 106.699018,
    radius_meters := 3000,
    filter_ac := true,
    exclude_ids := ARRAY['11111111-...']::uuid[],
    limit_count := 10
);
```
- Tính toán chính xác khoảng cách đường chim bay (`distance_meters`).
- Tự động lọc theo Vibe, mức giá, điều hòa, chỗ đậu ô tô.
- Loại trừ các quán trong `exclude_ids` (lịch sử 7 ngày từ localStorage).

### 4.3. Bảng `voting_rooms` & `room_votes`
- Cơ chế bình chọn không cần đăng nhập: Khách chỉ cần nhập `voter_name`.
- Supabase Realtime kích hoạt trên 2 bảng này để Host và Guests theo dõi tiến độ vote ngay lập tức.
- Hàm RPC `get_room_voting_results(room_id)` tự động đếm likes/dislikes và sắp xếp bảng xếp hạng.

---

## 5. DỮ LIỆU SEED (25 QUÁN ĂN MẪU TP.HCM)
- Đầy đủ 25 quán ăn thực tế nổi tiếng tại Quận 1, Quận 3, Bình Thạnh (Ba Ghiền, Phở Hòa Pasteur, Bánh mì Huỳnh Hoa, Pizza 4P's, Cơm niêu Sài Gòn, Hủ tiếu Nhân Quán, Lẩu bò Nhà Gỗ, Dim Tu Tac, Bún đậu A Chảnh...).
- Tọa độ GPS thật, giá cả chuẩn xác, ảnh món ăn Unsplash sống động, tag tiện ích chi tiết.

---

## 6. LỘ TRÌNH TRIỂN KHAI THEO YÊU CẦU
- [x] **Bước 1:** Thiết kế kiến trúc thư mục, viết toàn bộ SQL (`20241119000000_init_schema.sql`, `seed.sql`), Typescript definitions, constants và tài liệu kiến trúc.
- [x] **Bước 2:** Khởi tạo giao diện chính Mobile-first (Next.js layout, header GPS chọn nhanh các quận TP.HCM, 3 thẻ Vibe + Chỗ đỗ xe + Random, Polaroid Card hiển thị đúng 1 quán, tối đa 5 lần đổi quán, Modal Chốt quán & lưu `localStorage`).
- [x] **Bước 3:** Chốt kèo nhóm (Tạo phòng 6 ký tự, Chia sẻ link, Quẹt thẻ Tinder Framer Motion, Realtime Supabase, Hóa đơn nhiệt + Confetti, Vòng quay ai bao).
- [x] **Bước 4:** Đóng góp quán tủ (UGC Form) và PWA manifest/offline fallback.
- [x] **Bước 5:** Data Pipeline Overture Maps 495 quán TP.HCM thực tế, làm giàu AI Gemini, nạp Supabase, bộ ảnh WebP offline local.
- [x] **Bước 6:** Trang Lịch sử ăn uống 7 ngày (`/history`) quản lý danh sách quán đã chốt & tự động né trùng bữa.
