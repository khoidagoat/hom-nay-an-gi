-- ==============================================================================
-- DỰ ÁN: "HÔM NAY ĂN GÌ?" - SEED DATA (25 QUÁN ĂN THỰC TẾ TP.HCM)
-- Khu vực: Quận 1, Quận 3, Bình Thạnh (Tọa độ GPS thật, ảnh đồ ăn đẹp)
-- ==============================================================================

-- Xóa dữ liệu cũ nếu có
TRUNCATE TABLE public.room_votes CASCADE;
TRUNCATE TABLE public.voting_rooms CASCADE;
TRUNCATE TABLE public.restaurants CASCADE;

INSERT INTO public.restaurants (
    id,
    name,
    address,
    location,
    lat,
    lng,
    cuisine,
    price_level,
    price_range_text,
    has_ac,
    has_car_parking,
    free_moto_parking,
    image_url,
    vibe_tags,
    description,
    is_approved
) VALUES
-- 1. Cơm tấm Ba Ghiền (Q. Phú Nhuận giáp Q3)
(
    '11111111-1111-1111-1111-111111110001',
    'Cơm Tấm Ba Ghiền',
    '84 Đặng Văn Ngữ, P. 10, Q. Phú Nhuận (giáp Q3), TP.HCM',
    ST_SetSRID(ST_MakePoint(106.671049, 10.793264), 4326)::geography,
    10.793264,
    106.671049,
    'Cơm',
    2,
    '75k - 110k',
    false,
    false,
    true,
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ARRAY['an_nhanh', 'binh_dan'],
    'Miếng sườn khổng lồ che kín đĩa cơm, ướp mật ong nướng than hoa thơm nức mũi.',
    true
),

-- 2. Phở Hòa Pasteur (Q3)
(
    '11111111-1111-1111-1111-111111110002',
    'Phở Hòa Pasteur',
    '260C Pasteur, P. Võ Thị Sáu, Quận 3, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.690850, 10.787680), 4326)::geography,
    10.787680,
    106.690850,
    'Bún/Phở',
    2,
    '85k - 105k',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'an_nhanh', 'hen_ho'],
    'Nước dùng phở thanh ngọt gia truyền hơn 50 năm, quẩy giòn rụm và thịt bò tái mềm.',
    true
),

-- 3. Bún Bò Huế Út Hưng (Q3)
(
    '11111111-1111-1111-1111-111111110003',
    'Bún Bò Huế Út Hưng',
    '113 Bà Huyện Thanh Quan, P. Võ Thị Sáu, Quận 3, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.683520, 10.781350), 4326)::geography,
    10.781350,
    106.683520,
    'Bún/Phở',
    1,
    '45k - 60k',
    false,
    false,
    true,
    'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80',
    ARRAY['an_nhanh', 'binh_dan', 'cuoi_thang'],
    'Tô bún bò đậm đà nồng nàn hương sả ruốc, chả cua tự làm béo ngậy giòn sần sật.',
    true
),

-- 4. Bánh Mì Huỳnh Hoa (Q1)
(
    '11111111-1111-1111-1111-111111110004',
    'Bánh Mì Huỳnh Hoa',
    '26 Lê Thị Riêng, P. Bến Thành, Quận 1, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.692550, 10.771230), 4326)::geography,
    10.771230,
    106.692550,
    'Ăn vặt',
    2,
    '68k - 75k',
    false,
    false,
    true,
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    ARRAY['an_nhanh'],
    'Ổ bánh mì "ô môi" huyền thoại với lớp pate béo ngậy và đẫy đà giăm bông chả lụa.',
    true
),

-- 5. Cơm Niêu Sài Gòn (Q3)
(
    '11111111-1111-1111-1111-111111110005',
    'Cơm Niêu Sài Gòn',
    '27 Tú Xương, P. Võ Thị Sáu, Quận 3, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.687250, 10.780120), 4326)::geography,
    10.780120,
    106.687250,
    'Cơm',
    3,
    '150k - 300k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'hen_ho', 'di_o_to'],
    'Cơm đập giòn rụm chấm cá kho tộ đậm đà trong không gian nhà vườn mộc mạc hoài cổ.',
    true
),

-- 6. Hủ Tiếu Nam Vang Nhân Quán (Q1)
(
    '11111111-1111-1111-1111-111111110006',
    'Hủ Tiếu Nam Vang Nhân Quán',
    '122 Nguyễn Trãi, P. Bến Thành, Quận 1, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.689720, 10.768650), 4326)::geography,
    10.768650,
    106.689720,
    'Bún/Phở',
    2,
    '80k - 110k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1594998893017-36147cbcae05?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'an_nhanh', 'di_o_to'],
    'Hủ tiếu khô trộn sốt tỏi ớt đặc trưng, tôm tươi giòn ngọt cùng tô nước súp ngọt tủy xương.',
    true
),

-- 7. Lẩu Bò Nhà Gỗ Sài Gòn (Q3)
(
    '11111111-1111-1111-1111-111111110007',
    'Lẩu Bò Nhà Gỗ Sài Gòn',
    '162 Lý Thái Tổ, P. 1, Quận 3, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.678910, 10.766120), 4326)::geography,
    10.766120,
    106.678910,
    'Lẩu/Nướng',
    2,
    '120k - 200k',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'lau_nuong', 'hen_ho'],
    'Lẩu bò chuẩn vị Đà Lạt giữa lòng Sài Gòn, thịt bò mềm tan cùng chén chao sa tế cay nồng.',
    true
),

-- 8. Bún Đậu Mắm Tôm A Chảnh (Q1)
(
    '11111111-1111-1111-1111-111111110008',
    'Bún Đậu Mắm Tôm A Chảnh',
    '175 Cống Quỳnh, P. Nguyễn Cư Trinh, Quận 1, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.686980, 10.764510), 4326)::geography,
    10.764510,
    106.686980,
    'Bún/Phở',
    1,
    '35k - 65k',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'an_nhanh', 'binh_dan', 'cuoi_thang'],
    'Mẹt thập cẩm đầy đặn chả cốm giòn rụm, dồi sụn thơm nức mũi và mắm tôm đánh sủi bọt.',
    true
),

-- 9. Quán Bụi - Vietnamese Bistro (Q1)
(
    '11111111-1111-1111-1111-111111110009',
    'Quán Bụi - Vietnamese Bistro',
    '19 Ngô Văn Năm, P. Bến Nghé, Quận 1, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.704250, 10.779850), 4326)::geography,
    10.779850,
    106.704250,
    'Cơm',
    3,
    '150k - 350k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1505253758473-96b3d5ebcd96?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'hen_ho', 'di_o_to'],
    'Hương vị mâm cơm gia đình Việt chuẩn vị trong không gian Indochine tinh tế, ấm cúng.',
    true
),

-- 10. Sushi Nhí (Bình Thạnh)
(
    '11111111-1111-1111-1111-111111110010',
    'Sushi Nhí',
    '21 Nguyễn Công Trứ, P. 19, Q. Bình Thạnh, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.711830, 10.791520), 4326)::geography,
    10.791520,
    106.711830,
    'Đồ Á',
    2,
    '80k - 180k',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'hen_ho', 'binh_dan'],
    'Quán Nhật chân ái của giới trẻ với sashimi hồi tươi rói, cuộn maki đẫm sốt giá hợp lý.',
    true
),

-- 11. Pizza 4P''s Lê Thánh Tôn (Q1)
(
    '11111111-1111-1111-1111-111111110011',
    'Pizza 4P''s Lê Thánh Tôn',
    '8/15 Lê Thánh Tôn, P. Bến Nghé, Quận 1, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.703720, 10.779140), 4326)::geography,
    10.779140,
    106.703720,
    'Đồ Âu',
    3,
    '200k - 400k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'hen_ho', 'di_o_to'],
    'Pizza nướng củi phô mai Burrata tươi béo ngậy độc quyền và mì cua sốt kem trứ danh.',
    true
),

-- 12. Bánh Xèo Ăn Là Ghiền (Q1)
(
    '11111111-1111-1111-1111-111111110012',
    'Bánh Xèo Ăn Là Ghiền',
    '74 Sương Nguyệt Ánh, P. Bến Thành, Quận 1, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.688320, 10.772580), 4326)::geography,
    10.772580,
    106.688320,
    'Ăn vặt',
    2,
    '60k - 120k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'di_o_to'],
    'Chiếc bánh xèo vàng ươm giòn tan cuốn trọn rổ rau rừng tươi xanh mơn mởn.',
    true
),

-- 13. Cơm Gà Đông Nguyên (Q5 giáp Q1)
(
    '11111111-1111-1111-1111-111111110013',
    'Cơm Gà Hải Nam Đông Nguyên',
    '801 Nguyễn Trãi, P. 14, Quận 5 (giáp Q1), TP.HCM',
    ST_SetSRID(ST_MakePoint(106.662580, 10.753890), 4326)::geography,
    10.753890,
    106.662580,
    'Cơm',
    2,
    '65k - 95k',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'an_nhanh'],
    'Cơm dẻo vàng óng nấu từ nước luộc gà, thịt gà luộc da giòn thịt ngọt chấm gừng ớt.',
    true
),

-- 14. Bún Chả 145 Bùi Viện (Q1)
(
    '11111111-1111-1111-1111-111111110014',
    'Bún Chả 145 Bùi Viện',
    '145 Bùi Viện, P. Phạm Ngũ Lão, Quận 1, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.691880, 10.767420), 4326)::geography,
    10.767420,
    106.691880,
    'Bún/Phở',
    1,
    '45k - 70k',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'an_nhanh', 'binh_dan', 'cuoi_thang'],
    'Thịt nướng than hoa thơm lừng đựng trong thố gốm, nước mắm đu đủ chua ngọt thanh tao.',
    true
),

-- 15. Gà Nướng Ò Ó O (Q1)
(
    '11111111-1111-1111-1111-111111110015',
    'Gà Nướng Ò Ó O',
    '214/19 Nguyễn Văn Nguyễn, P. Tân Định, Quận 1, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.691450, 10.792810), 4326)::geography,
    10.792810,
    106.691450,
    'Lẩu/Nướng',
    2,
    '70k - 150k',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'lau_nuong', 'hen_ho'],
    'Gà nướng sốt ớt cay Địa Trung Hải thơm nức mũi, thịt mềm mọng nước da vàng giòn.',
    true
),

-- 16. Miến Lươn 144 - Đặc Sản Xứ Nghệ (Q3)
(
    '11111111-1111-1111-1111-111111110016',
    'Miến Lươn 144 - Đặc Sản Xứ Nghệ',
    '144C Lý Chính Thắng, P. Võ Thị Sáu, Quận 3, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.685410, 10.787920), 4326)::geography,
    10.787920,
    106.685410,
    'Bún/Phở',
    1,
    '40k - 60k',
    false,
    false,
    true,
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    ARRAY['an_nhanh', 'binh_dan', 'cuoi_thang'],
    'Miến lươn giòn rụm hoặc lươn xào mềm cay nồng vị hành tăm chuẩn phong vị Nghệ An.',
    true
),

-- 17. Cháo Ếch Singapore Geylang Lor 9 (Q1)
(
    '11111111-1111-1111-1111-111111110017',
    'Cháo Ếch Singapore Geylang Lor 9',
    '35 Đinh Tiên Hoàng, P. Đa Kao, Quận 1, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.699850, 10.789120), 4326)::geography,
    10.789120,
    106.699850,
    'Đồ Á',
    2,
    '80k - 150k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'hen_ho', 'di_o_to'],
    'Thố ếch kho sền sệt đậm đà sốt cay xé lưỡi ăn kèm thố cháo trắng rắc hành lá ấm bụng.',
    true
),

-- 18. Mì Quảng Sâm (Q3 giáp Tân Bình)
(
    '11111111-1111-1111-1111-111111110018',
    'Mì Quảng Sâm',
    '8 Ca Văn Thỉnh, P. 11, Tân Bình (giáp Q3), TP.HCM',
    ST_SetSRID(ST_MakePoint(106.653420, 10.787450), 4326)::geography,
    10.787450,
    106.653420,
    'Bún/Phở',
    1,
    '35k - 50k',
    false,
    false,
    true,
    'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80',
    ARRAY['an_nhanh', 'binh_dan', 'cuoi_thang'],
    'Sợi mì dẻo dai chan nước nhưn tôm thịt đậm vị miền Trung cùng bánh tráng mè giòn rụm.',
    true
),

-- 19. Hủ Tiếu Mực Ông Già Cali (Q3)
(
    '11111111-1111-1111-1111-111111110019',
    'Hủ Tiếu Mực Ông Già Cali',
    '140 Nguyễn Đình Chiểu, P. Võ Thị Sáu, Quận 3, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.692310, 10.782850), 4326)::geography,
    10.782850,
    106.692310,
    'Bún/Phở',
    2,
    '69k - 95k',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'an_nhanh'],
    'Mực tươi rói giòn sần sật chấm muối ớt xanh cay nồng, nước súp ngọt thanh thơm lừng.',
    true
),

-- 20. Dim Tu Tac - Cantonese Restaurant (Q1)
(
    '11111111-1111-1111-1111-111111110020',
    'Dim Tu Tac - Cantonese Restaurant',
    '55 Đông Du, P. Bến Nghé, Quận 1, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.705180, 10.776210), 4326)::geography,
    10.776210,
    106.705180,
    'Đồ Á',
    3,
    '200k - 500k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'hen_ho', 'di_o_to'],
    'Thế giới dimsum Quảng Đông thượng hạng: há cảo tôm thủy tinh, bánh bao kim sa tan chảy.',
    true
),

-- 21. Bún Mắm Cô Ba (Q1)
(
    '11111111-1111-1111-1111-111111110021',
    'Bún Mắm Cô Bông (Chợ Tân Định)',
    '125 Nguyễn Hữu Cầu, P. Tân Định, Quận 1, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.691250, 10.790510), 4326)::geography,
    10.790510,
    106.691250,
    'Bún/Phở',
    2,
    '65k - 85k',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'an_nhanh'],
    'Tô bún mắm miền Tây thơm nức mũi với tôm tươi, mực giòn, heo quay da rụm giòn tan.',
    true
),

-- 22. Cơm Trưa Văn Phòng Má Heo (Q3)
(
    '11111111-1111-1111-1111-111111110022',
    'Cơm Tấm Sườn Cây Võ Thị Sáu',
    '169 Võ Thị Sáu, P. Võ Thị Sáu, Quận 3, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.689250, 10.782410), 4326)::geography,
    10.782410,
    106.689250,
    'Cơm',
    1,
    '35k - 45k',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'an_nhanh', 'binh_dan', 'cuoi_thang'],
    'Cơm trưa văn phòng đổi món theo ngày: sườn ram mặn, cá lóc kho tộ, canh chua thanh mát.',
    true
),

-- 23. Bún Riêu Gánh Chợ Bến Thành (Q1)
(
    '11111111-1111-1111-1111-111111110023',
    'Bún Riêu Gánh Chợ Bến Thành',
    '4 Phan Bội Châu, P. Bến Thành, Quận 1, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.698750, 10.772890), 4326)::geography,
    10.772890,
    106.698750,
    'Bún/Phở',
    2,
    '55k - 75k',
    false,
    false,
    true,
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    ARRAY['an_nhanh', 'binh_dan'],
    'Nồi bún riêu gánh đỏ au màu gạch cua và cà chua, nước dùng thanh ngọt thơm nồng me mắm.',
    true
),

-- 24. Nem Nướng Nha Trang Bé Thảo (Bình Thạnh)
(
    '11111111-1111-1111-1111-111111110024',
    'Nem Nướng Nha Trang Bé Thảo',
    '123 Hoàng Sa, P. 11, Quận 3 (ven kênh Nhiêu Lộc), TP.HCM',
    ST_SetSRID(ST_MakePoint(106.680120, 10.789420), 4326)::geography,
    10.789420,
    106.680120,
    'Ăn vặt',
    1,
    '45k - 60k',
    false,
    false,
    true,
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ARRAY['an_nhanh', 'binh_dan', 'cuoi_thang'],
    'Cây nem nướng thơm lừng cuốn bánh tráng, ram giòn và xoài xanh chấm nước sốt thịt ấm nóng.',
    true
),

-- 25. Lẩu Gà Lá É Tao Ngộ (Q1)
(
    '11111111-1111-1111-1111-111111110025',
    'Lẩu Gà Lá É Tao Ngộ',
    '79 Trần Khắc Chân, P. Tân Định, Quận 1, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.690820, 10.794150), 4326)::geography,
    10.794150,
    106.690820,
    'Lẩu/Nướng',
    2,
    '100k - 180k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'lau_nuong', 'di_o_to', 'hen_ho'],
    'Nồi lẩu gà lá é chuẩn vị Đà Lạt cay nồng vị ớt xiêm xanh và thơm lừng thảo mộc lá é.',
    true
),

-- 26. Matchandeul BBQ Hàn Quốc (Q7)
(
    '11111111-1111-1111-1111-111111110026',
    'Matchandeul BBQ Hàn Quốc',
    '49 Cao Triều Phát, Hưng Gia 4, Tân Phong, Quận 7, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.708890, 10.730380), 4326)::geography,
    10.730380,
    106.708890,
    'Đồ Á',
    3,
    '200k - 400k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'hen_ho', 'lau_nuong'],
    'Thịt ba chỉ nướng than chuẩn Hàn Quốc Phú Mỹ Hưng, dày mọng nước và panchan ăn thả ga.',
    true
),

-- 27. Hủ Tiếu Nam Vang Tài Anh (Q7)
(
    '11111111-1111-1111-1111-111111110027',
    'Hủ Tiếu Nam Vang Tài Anh',
    '494 Nguyễn Thị Thập, P. Tân Quy, Quận 7, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.707820, 10.742510), 4326)::geography,
    10.742510,
    106.707820,
    'Bún/Phở',
    2,
    '65k - 85k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'an_nhanh'],
    'Tô hủ tiếu Nam Vang trứ danh Quận 7, tôm tươi giòn ngọt, thịt bằm và xương tủy béo ngậy.',
    true
),

-- 28. Cơm Tấm Thuận Kiều Quận 7 (Q7)
(
    '11111111-1111-1111-1111-111111110028',
    'Cơm Tấm Thuận Kiều Quận 7',
    '52 Đặng Đức Thuật, P. Tân Phong, Quận 7, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.707540, 10.729120), 4326)::geography,
    10.729120,
    106.707540,
    'Cơm',
    2,
    '65k - 110k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'an_nhanh'],
    'Đĩa cơm tấm hạt tơi thơm lừng, sườn nướng mật ong vàng ruộm và chả trứng béo ngậy.',
    true
),

-- 29. Phở Trang - Phú Mỹ Hưng (Q7)
(
    '11111111-1111-1111-1111-111111110029',
    'Phở Trang - Phú Mỹ Hưng',
    '420 Phạm Thái Bường, P. Tân Phong, Quận 7 (Phú Mỹ Hưng), TP.HCM',
    ST_SetSRID(ST_MakePoint(106.708200, 10.725800), 4326)::geography,
    10.725800,
    106.708200,
    'Bún/Phở',
    2,
    '75k - 100k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'an_nhanh', 'hen_ho'],
    'Nước phở ngọt thanh hầm tủy bò 12 tiếng, không gian máy lạnh sạch sẽ thoáng mát.',
    true
),

-- 30. Lẩu Dê 404 Nguyễn Thị Thập (Q7)
(
    '11111111-1111-1111-1111-111111110030',
    'Lẩu Dê 404 Nguyễn Thị Thập',
    '436 Nguyễn Thị Thập, P. Tân Quy, Quận 7, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.706510, 10.743120), 4326)::geography,
    10.743120,
    106.706510,
    'Lẩu/Nướng',
    2,
    '120k - 220k',
    false,
    true,
    true,
    'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=800&q=80',
    ARRAY['lau_nuong'],
    'Dê nướng mọi thơm phức và lẩu dê thuốc bắc bổ dưỡng, chén chao sa tế cay nức tiếng.',
    true
),

-- 31. Pizza 4P''s Crescent Mall (Q7)
(
    '11111111-1111-1111-1111-111111110031',
    'Pizza 4P''s Crescent Mall',
    'Tầng 6, Crescent Mall, 101 Tôn Dật Tiên, Tân Phú, Quận 7, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.721450, 10.719820), 4326)::geography,
    10.719820,
    106.721450,
    'Đồ Âu',
    3,
    '200k - 450k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'hen_ho'],
    'View hồ Bán Nguyệt lãng mạn, pizza nướng củi phô mai Burrata và mì cua sốt kem thơm béo.',
    true
),

-- 32. Bún Bò Huế O Oanh (Q7)
(
    '11111111-1111-1111-1111-111111110032',
    'Quán Ngự Bình - Món Huế & Miền Trung',
    '196 Lâm Văn Bền, P. Tân Quy, Quận 7, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.718920, 10.746810), 4326)::geography,
    10.746810,
    106.718920,
    'Bún/Phở',
    1,
    '40k - 55k',
    false,
    false,
    true,
    'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80',
    ARRAY['an_nhanh', 'binh_dan', 'cuoi_thang'],
    'Tô bún bò bình dân chuẩn Huế, nước dùng dậy mùi mắm ruốc sả ớt, bắp hoa giòn sần sật.',
    true
),

-- 33. Cơm Niêu Thiên Lý Quận 7 (Q7)
(
    '11111111-1111-1111-1111-111111110033',
    'Cơm Niêu Thiên Lý Quận 7',
    '74 Nguyễn Thị Thập, KDC Him Lam, Tân Hưng, Quận 7, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.702180, 10.749150), 4326)::geography,
    10.749150,
    106.702180,
    'Cơm',
    2,
    '80k - 150k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'hen_ho'],
    'Cơm cháy giòn tan thơm bơ chấm sốt thịt kho quẹt đậm đà trong không gian ấm cúng.',
    true
),

-- 34. Bún Đậu Mắm Tôm Mạc Văn Khoa (Q7)
(
    '11111111-1111-1111-1111-111111110034',
    'Bún Đậu Mắm Tôm Mạc Văn Khoa',
    '253 Phan Huy Thực, P. Tân Kiểng, Quận 7, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.708950, 10.748210), 4326)::geography,
    10.748210,
    106.708950,
    'Bún/Phở',
    1,
    '39k - 65k',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'an_nhanh', 'binh_dan', 'cuoi_thang'],
    'Mẹt bún đậu đầy ắp chả cốm giòn xốp, dồi chiên giòn rụm và mắm tôm Thanh Hóa thơm ngon.',
    true
),

-- 35. Bánh Mì Chảo Cô 3 Hậu (Q7)
(
    '11111111-1111-1111-1111-111111110035',
    'Bánh Mì Chảo Cô 3 Hậu',
    '36 Đường số 79, P. Tân Quy, Quận 7, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.711250, 10.744150), 4326)::geography,
    10.744150,
    106.711250,
    'Ăn vặt',
    1,
    '35k - 50k',
    false,
    false,
    true,
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    ARRAY['an_nhanh', 'binh_dan', 'cuoi_thang'],
    'Chảo bánh mì xèo xèo với trứng ốp la lòng đào, pate béo ngậy, xúc xích và sốt cà chua ấm nóng.',
    true
),

-- 36. Gogi House Lotte Mart Q7 (Q7)
(
    '11111111-1111-1111-1111-111111110036',
    'Gogi House Lotte Mart Q7',
    'Tầng 1 Lotte Mart, 469 Nguyễn Hữu Thọ, Tân Hưng, Quận 7, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.700120, 10.743890), 4326)::geography,
    10.743890,
    106.700120,
    'Lẩu/Nướng',
    3,
    '200k - 380k',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
    ARRAY['mat_me', 'hen_ho', 'lau_nuong'],
    'Thịt nướng Hàn Quốc thượng hạng, dẻ sườn bò Mỹ sốt Galbi thơm lừng trong TTTM mát lạnh.',
    true
),

-- 37. Cơm Trưa Văn Phòng Cô Ba (Q7)
(
    '11111111-1111-1111-1111-111111110037',
    'Cơm Trưa Văn Phòng Cô Ba',
    '147 Mai Văn Vĩnh, P. Tân Quy, Quận 7, TP.HCM',
    ST_SetSRID(ST_MakePoint(106.713450, 10.747120), 4326)::geography,
    10.747120,
    106.713450,
    'Cơm',
    1,
    '35k - 45k',
    false,
    false,
    true,
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    ARRAY['an_nhanh', 'binh_dan', 'cuoi_thang'],
    'Cơm trưa bình dân đổi món liên tục: gà kho sả ớt, thịt luộc cà pháo, canh rau tập tàng.',
    true
);
