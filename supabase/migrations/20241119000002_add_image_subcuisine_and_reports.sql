-- ==============================================================================
-- MIGRATION: BỔ SUNG CỘT ẢNH MINH HỌA, SUB_CUISINE VÀ TÍNH NĂNG BÁO LỖI QUÁN ĂN
-- ==============================================================================

-- 1. Bổ sung các cột mới vào bảng restaurants
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS is_real_image BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS sub_cuisine TEXT,
ADD COLUMN IF NOT EXISTS report_count INT NOT NULL DEFAULT 0;

-- 2. Tạo chỉ mục tìm kiếm theo sub_cuisine và report_count
CREATE INDEX IF NOT EXISTS idx_restaurants_sub_cuisine ON public.restaurants (sub_cuisine);
CREATE INDEX IF NOT EXISTS idx_restaurants_report_count ON public.restaurants (report_count);

-- 3. Tạo bảng lưu trữ phản hồi báo lỗi từ người dùng (Zero Friction)
CREATE TABLE IF NOT EXISTS public.restaurant_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('wrong_address', 'closed', 'wrong_info')),
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chỉ mục hỗ trợ thống kê theo quán ăn
CREATE INDEX IF NOT EXISTS idx_restaurant_reports_restaurant_id ON public.restaurant_reports (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_reports_created_at ON public.restaurant_reports (created_at DESC);

-- Bật Row Level Security (RLS) cho bảng báo lỗi
ALTER TABLE public.restaurant_reports ENABLE ROW LEVEL SECURITY;

-- Cho phép người dùng ẩn danh gửi báo lỗi (Insert)
CREATE POLICY "Cho phép mọi người gửi báo lỗi quán" 
ON public.restaurant_reports 
FOR INSERT 
WITH CHECK (true);

-- 4. RPC Function: report_restaurant(p_restaurant_id, p_reason, p_details)
-- Tự động tăng report_count và tự động ẩn quán (is_approved = false) nếu bị báo cáo >= 2 lần
CREATE OR REPLACE FUNCTION public.report_restaurant(
  p_restaurant_id UUID,
  p_reason TEXT,
  p_details TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count INT;
  v_is_hidden BOOLEAN := false;
BEGIN
  -- Kiểm tra quán có tồn tại không
  IF NOT EXISTS (SELECT 1 FROM public.restaurants WHERE id = p_restaurant_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quán không tồn tại');
  END IF;

  -- 1. Ghi nhận lượt báo lỗi vào bảng restaurant_reports
  INSERT INTO public.restaurant_reports (restaurant_id, reason, details)
  VALUES (p_restaurant_id, p_reason, p_details);

  -- 2. Tăng số đếm report_count của quán
  UPDATE public.restaurants
  SET report_count = report_count + 1
  WHERE id = p_restaurant_id
  RETURNING report_count INTO v_new_count;

  -- 3. Nếu bị báo cáo từ 2 lần trở lên, tự động ẩn quán khỏi kết quả tìm kiếm
  IF v_new_count >= 2 THEN
    UPDATE public.restaurants
    SET is_approved = false
    WHERE id = p_restaurant_id;
    v_is_hidden := true;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'report_count', v_new_count,
    'is_hidden', v_is_hidden
  );
END;
$$;
