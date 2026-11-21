-- ==============================================================================
-- DỰ ÁN: "HÔM NAY ĂN GÌ?" - DATABASE SCHEMA
-- Hệ cơ sở dữ liệu: Supabase (PostgreSQL 15+)
-- Tiện ích: PostGIS (Không dùng Google Places API - 0đ chi phí vận hành)
-- ==============================================================================

-- 1. KÍCH HOẠT EXTENSION POSTGIS ĐỂ TÍNH TOÁN BÁN KÍNH KHÔNG GIAN
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. BẢNG: restaurants (Danh sách quán ăn & dữ liệu không gian)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overture_id TEXT UNIQUE, -- Mã định danh Overture Maps dùng cho upsert không trùng lặp
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    -- Điểm tọa độ địa lý (PostGIS Geography SRID 4326 - WGS84: Kinh độ trước, Vĩ độ sau)
    location GEOGRAPHY(Point, 4326) NOT NULL,
    lat FLOAT8 NOT NULL,
    lng FLOAT8 NOT NULL,
    cuisine TEXT NOT NULL, -- 'Cơm', 'Bún/Phở', 'Đồ Á', 'Đồ Âu', 'Ăn vặt', 'Lẩu/Nướng'
    price_level INT NOT NULL CHECK (price_level IN (1, 2, 3, 4)), -- Chuẩn Google: 1=1-100k, 2=100-200k, 3=200-600k, 4=>600k
    price_range_text TEXT NOT NULL, -- VD: '35k - 55k', '250k - 450k'
    rating FLOAT8 NOT NULL DEFAULT 4.5, -- Điểm đánh giá Google (VD: 4.8)
    review_count INT NOT NULL DEFAULT 200, -- Số lượt đánh giá Google (VD: 1250)
    has_ac BOOLEAN NOT NULL DEFAULT false, -- Máy lạnh
    has_car_parking BOOLEAN NOT NULL DEFAULT false, -- Chỗ đậu ô tô
    free_moto_parking BOOLEAN NOT NULL DEFAULT true, -- Giữ xe máy miễn phí
    image_url TEXT NOT NULL, -- Link ảnh món ăn từ Unsplash/CDN
    vibe_tags TEXT[] NOT NULL DEFAULT '{}', -- VD: ARRAY['mat_me', 'an_nhanh', 'binh_dan', 'hen_ho']
    description TEXT, -- Mô tả chi tiết
    short_reason TEXT, -- 1 câu lý do đề xuất ngắn gọn, vui vẻ bằng tiếng Việt
    source TEXT NOT NULL DEFAULT 'ugc' CHECK (source IN ('overture', 'seed', 'ugc')),
    confidence FLOAT8, -- Điểm tin cậy từ Overture Maps
    is_approved BOOLEAN NOT NULL DEFAULT true, -- Quản lý duyệt quán (Dev mode: default true)
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Chỉ mục không gian (Spatial Index) tăng tốc truy vấn bán kính
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON public.restaurants USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_restaurants_overture_id ON public.restaurants (overture_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_source ON public.restaurants (source);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON public.restaurants (cuisine);
CREATE INDEX IF NOT EXISTS idx_restaurants_price_level ON public.restaurants (price_level);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON public.restaurants (rating);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_approved ON public.restaurants (is_approved);

-- Trigger tự động đồng bộ cột `location` mỗi khi `lat`, `lng` được thêm hoặc cập nhật
CREATE OR REPLACE FUNCTION public.sync_restaurant_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_restaurant_location ON public.restaurants;
CREATE TRIGGER trg_sync_restaurant_location
BEFORE INSERT OR UPDATE OF lat, lng ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.sync_restaurant_location();

-- ==============================================================================
-- 3. BẢNG: voting_rooms (Phòng Chốt Kèo Nhóm - Group Voting)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.voting_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(6) UNIQUE NOT NULL, -- Mã phòng 6 ký tự viết hoa (VD: 'K3O8A9')
    host_name TEXT NOT NULL,
    restaurant_ids UUID[] NOT NULL DEFAULT '{}', -- Tối đa 10 quán quanh vị trí host
    status TEXT NOT NULL CHECK (status IN ('waiting', 'voting', 'completed')) DEFAULT 'waiting',
    vibe_selected TEXT,
    radius_meters INT NOT NULL DEFAULT 5000,
    host_lat FLOAT8,
    host_lng FLOAT8,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_voting_rooms_code ON public.voting_rooms (room_code);
CREATE INDEX IF NOT EXISTS idx_voting_rooms_status ON public.voting_rooms (status);

-- ==============================================================================
-- 4. BẢNG: room_votes (Lưu lượt Quẹt Trái / Quẹt Phải của từng người)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.room_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.voting_rooms(id) ON DELETE CASCADE,
    voter_name TEXT NOT NULL,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    is_like BOOLEAN NOT NULL, -- true: Quẹt phải (Thích), false: Quẹt trái (Chê)
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_room_voter_restaurant UNIQUE (room_id, voter_name, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_room_votes_room_id ON public.room_votes (room_id);
CREATE INDEX IF NOT EXISTS idx_room_votes_restaurant_id ON public.room_votes (restaurant_id);

-- ==============================================================================
-- 5. POSTGIS RPC FUNCTION: get_nearby_restaurants
-- Tuân thủ bán kính nghiêm ngặt (chỉ lệch tối đa 200m)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_nearby_restaurants(
    user_lat FLOAT8,
    user_lng FLOAT8,
    radius_meters FLOAT8 DEFAULT 5000,
    filter_ac BOOLEAN DEFAULT NULL,
    filter_car_parking BOOLEAN DEFAULT NULL,
    filter_moto_parking BOOLEAN DEFAULT NULL,
    price_tiers INT[] DEFAULT NULL, -- [1], [1,2], [3,4], v.v.
    cuisine_filter TEXT DEFAULT NULL,
    vibe_filters TEXT[] DEFAULT NULL,
    exclude_ids UUID[] DEFAULT '{}',
    limit_count INT DEFAULT 25
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    lat FLOAT8,
    lng FLOAT8,
    cuisine TEXT,
    price_level INT,
    price_range_text TEXT,
    rating FLOAT8,
    review_count INT,
    has_ac BOOLEAN,
    has_car_parking BOOLEAN,
    free_moto_parking BOOLEAN,
    image_url TEXT,
    vibe_tags TEXT[],
    description TEXT,
    distance_meters INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_point GEOGRAPHY;
    max_radius FLOAT8;
BEGIN
    user_point := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
    -- Cho phép dung sai tối đa 200 mét theo yêu cầu
    max_radius := radius_meters + 200;

    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.address,
        r.lat,
        r.lng,
        r.cuisine,
        r.price_level,
        r.price_range_text,
        r.rating,
        r.review_count,
        r.has_ac,
        r.has_car_parking,
        r.free_moto_parking,
        r.image_url,
        r.vibe_tags,
        r.description,
        ROUND(ST_Distance(r.location, user_point))::INT AS distance_meters
    FROM public.restaurants r
    WHERE 
        r.is_approved = true
        -- Bán kính nghiêm ngặt (chỉ lệch tối đa 200m)
        AND ST_DWithin(r.location, user_point, max_radius)
        -- Loại trừ lịch sử 7 ngày
        AND (exclude_ids IS NULL OR r.id != ALL(exclude_ids))
        -- Lọc máy lạnh
        AND (filter_ac IS NULL OR r.has_ac = filter_ac)
        -- Lọc chỗ đậu ô tô
        AND (filter_car_parking IS NULL OR r.has_car_parking = filter_car_parking)
        -- Lọc xe máy
        AND (filter_moto_parking IS NULL OR r.free_moto_parking = filter_moto_parking)
        -- Lọc mức giá theo mảng Google price tiers
        AND (price_tiers IS NULL OR cardinality(price_tiers) = 0 OR r.price_level = ANY(price_tiers))
        -- Lọc theo loại ẩm thực
        AND (cuisine_filter IS NULL OR cuisine_filter = '' OR r.cuisine = cuisine_filter)
        -- Lọc theo các tag Vibe
        AND (vibe_filters IS NULL OR cardinality(vibe_filters) = 0 OR r.vibe_tags && vibe_filters)
    ORDER BY distance_meters ASC
    LIMIT limit_count;
END;
$$;

-- ==============================================================================
-- 6. RPC FUNCTION: get_room_voting_results
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_room_voting_results(p_room_id UUID)
RETURNS TABLE (
    restaurant_id UUID,
    name TEXT,
    address TEXT,
    cuisine TEXT,
    price_range_text TEXT,
    rating FLOAT8,
    review_count INT,
    image_url TEXT,
    lat FLOAT8,
    lng FLOAT8,
    likes_count BIGINT,
    dislikes_count BIGINT,
    total_votes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id AS restaurant_id,
        r.name,
        r.address,
        r.cuisine,
        r.price_range_text,
        r.rating,
        r.review_count,
        r.image_url,
        r.lat,
        r.lng,
        COUNT(rv.id) FILTER (WHERE rv.is_like = true) AS likes_count,
        COUNT(rv.id) FILTER (WHERE rv.is_like = false) AS dislikes_count,
        COUNT(rv.id) AS total_votes
    FROM unnest((SELECT vr.restaurant_ids FROM public.voting_rooms vr WHERE vr.id = p_room_id)) AS rest_id
    JOIN public.restaurants r ON r.id = rest_id
    LEFT JOIN public.room_votes rv ON rv.restaurant_id = r.id AND rv.room_id = p_room_id
    GROUP BY r.id, r.name, r.address, r.cuisine, r.price_range_text, r.rating, r.review_count, r.image_url, r.lat, r.lng
    ORDER BY likes_count DESC, total_votes DESC;
END;
$$;

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved restaurants"
ON public.restaurants FOR SELECT
USING (is_approved = true);

CREATE POLICY "Public can submit new restaurant"
ON public.restaurants FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public read voting rooms"
ON public.voting_rooms FOR SELECT
USING (true);

CREATE POLICY "Public create voting rooms"
ON public.voting_rooms FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update voting rooms"
ON public.voting_rooms FOR UPDATE
USING (true);

CREATE POLICY "Public read room votes"
ON public.room_votes FOR SELECT
USING (true);

CREATE POLICY "Public cast vote"
ON public.room_votes FOR INSERT
WITH CHECK (true);

-- ==============================================================================
-- 8. KÍCH HOẠT SUPABASE REALTIME
-- ==============================================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.voting_rooms, public.room_votes;
COMMIT;
