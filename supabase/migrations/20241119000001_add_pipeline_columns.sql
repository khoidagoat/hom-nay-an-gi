-- ==============================================================================
-- MIGRATION: BỔ SUNG CÁC CỘT HỖ TRỢ DATA PIPELINE (OVERTURE MAPS + AI ENRICHMENT)
-- ==============================================================================

-- 1. Bổ sung các cột vào bảng restaurants
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS overture_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS short_reason TEXT,
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'ugc' CHECK (source IN ('overture', 'seed', 'ugc')),
ADD COLUMN IF NOT EXISTS confidence FLOAT8;

-- 2. Tạo chỉ mục tìm kiếm nhanh theo overture_id phục vụ Upsert idempotent
CREATE INDEX IF NOT EXISTS idx_restaurants_overture_id ON public.restaurants (overture_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_source ON public.restaurants (source);

-- 3. Cập nhật các bản ghi seed hiện tại có source = 'seed'
UPDATE public.restaurants 
SET source = 'seed', short_reason = description 
WHERE source = 'ugc' AND overture_id IS NULL;
