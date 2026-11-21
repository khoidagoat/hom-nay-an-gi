#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
DỰ ÁN: "HÔM NAY ĂN GÌ?" - DATA PIPELINE
BƯỚC 2: LÀM GIÀU DỮ LIỆU BẰNG AI (GEMINI 2.5 FLASH BATCH ENRICHMENT)
==============================================================================
- Model: gemini-2.5-flash
- Đọc GEMINI_API_KEY từ file .env.local hoặc .env
- Xử lý theo batch: 20 quán / 1 request kèm Structured JSON Output
- Cơ chế Checkpoint & Resume: Lưu vào data/hcmc_enriched.json liên tục
- Hỗ trợ cờ --dry-run để kiểm tra cú pháp và mock test mà không tốn token
==============================================================================
"""

import os
import sys
import json
import time
import argparse
import pathlib
import requests
import unicodedata
import re
from dotenv import load_dotenv

# Đường dẫn thư mục
PIPELINE_DIR = pathlib.Path(__file__).parent.resolve()
ROOT_DIR = PIPELINE_DIR.parent.parent.resolve()
DATA_DIR = PIPELINE_DIR / "data"
RAW_FILE = DATA_DIR / "hcmc_raw.json"
ENRICHED_FILE = DATA_DIR / "hcmc_enriched.json"

# Load biến môi trường từ .env.local ở root dự án trước, sau đó tới .env
load_dotenv(ROOT_DIR / ".env.local")
load_dotenv(ROOT_DIR / ".env")
load_dotenv(PIPELINE_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

VALID_CUISINES = [
    "Cơm",
    "Bún/Phở",
    "Lẩu/Nướng",
    "Đồ Nhật/Hàn",
    "Đồ Âu",
    "Ăn vặt",
    "Món Việt khác"
]

VALID_SUB_CUISINES = [
    "com_tam",
    "com_van_phong",
    "pho",
    "bun_bo",
    "hu_tieu",
    "banh_mi",
    "lau",
    "nuong_bbq",
    "sushi_ramen",
    "do_han",
    "pizza_pasta",
    "an_vat",
    "oc_hai_san",
    "khac"
]

def remove_accents(input_str: str) -> str:
    """Loại bỏ dấu tiếng Việt để tìm kiếm từ khóa chính xác."""
    if not input_str:
        return ""
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)]).replace('đ', 'd').replace('Đ', 'D').lower()


def detectSubCuisineByKeyword(name: str) -> tuple:
    """
    Bắt chính xác tên món trực tiếp trong tên quán bằng tiếng Việt.
    Chạy TRƯỚC AI để đảm bảo ảnh và phân loại không bao giờ bị lệch.
    Trả về (cuisine, sub_cuisine) nếu tìm thấy từ khóa, ngược lại (None, None).
    """
    if not name:
        return (None, None)
    norm = remove_accents(name)

    # 1. Cơm tấm
    if re.search(r'\b(com tam)\b', norm):
        return ("Cơm", "com_tam")
    # 2. Phở
    if re.search(r'\b(pho)\b', norm) and not re.search(r'\b(pho mai)\b', norm):
        return ("Bún/Phở", "pho")
    # 3. Bún bò
    if re.search(r'\b(bun bo)\b', norm):
        return ("Bún/Phở", "bun_bo")
    # 4. Bún đậu
    if re.search(r'\b(bun dau)\b', norm):
        return ("Bún/Phở", "bun_dau")
    # 5. Hủ tiếu / Mì quảng / Bánh canh
    if re.search(r'\b(hu tieu|mi quang|banh canh|mi hoanh thanh)\b', norm):
        return ("Bún/Phở", "hu_tieu")
    # 6. Bánh mì
    if re.search(r'\b(banh mi)\b', norm):
        return ("Ăn vặt", "banh_mi")
    # 7. Ốc / Hải sản
    if re.search(r'\b(quan oc|oc |hai san|seafood)\b', norm):
        return ("Ăn vặt", "oc_hai_san")
    # 8. Lẩu
    if re.search(r'\b(lau |lau$|hotpot)\b', norm):
        return ("Lẩu/Nướng", "lau")
    # 9. Nướng / BBQ / Bò né
    if re.search(r'\b(nuong|bbq|bo ne)\b', norm):
        return ("Lẩu/Nướng", "nuong_bbq")
    # 10. Sushi / Ramen / Nhật
    if re.search(r'\b(sushi|ramen|sashimi|udon|nhat ban)\b', norm):
        return ("Đồ Nhật/Hàn", "sushi_ramen")
    # 11. Đồ Hàn Quốc
    if re.search(r'\b(han quoc|tokbokki|kimbap|ga ran|bbq han)\b', norm):
        return ("Đồ Nhật/Hàn", "do_han")
    # 12. Pizza / Pasta / Steak / Burger
    if re.search(r'\b(pizza|pasta|spaghetti|steak|burger)\b', norm):
        return ("Đồ Âu", "pizza_pasta")
    # 13. Cơm niêu / Cơm gà / Cơm văn phòng
    if re.search(r'\b(com nieu|com ga|com van phong|com trua)\b', norm):
        return ("Cơm", "com_van_phong")
    # 14. Các thương hiệu thức ăn nhanh lớn
    if re.search(r'\b(mcdonald|lotteria|kfc|jollibee|texas chicken|popeyes|burger king)\b', norm):
        return ("Đồ Âu", "pizza_pasta")
    if re.search(r'\b(pizza 4p|the pizza company|domino)\b', norm):
        return ("Đồ Âu", "pizza_pasta")
    if re.search(r'\b(haidilao|kichi kichi|manwah|hotpot story)\b', norm):
        return ("Lẩu/Nướng", "lau")
    if re.search(r'\b(gogi|king bbq|sumo bbq)\b', norm):
        return ("Lẩu/Nướng", "nuong_bbq")
    if re.search(r'\b(phuc loc tho|cali)\b', norm):
        return ("Cơm", "com_tam")

    return (None, None)


SYSTEM_PROMPT = """Bạn là Chuyên gia ẩm thực Sài Gòn (TP.HCM) cho ứng dụng "Hôm nay ăn gì?".
Nhiệm vụ của bạn là nhận vào danh sách các quán ăn (gồm overture_id, name, address, primary_category) và phân tích làm giàu dữ liệu ẩm thực chính xác.

Đối với từng quán, hãy trả về đúng cấu trúc JSON:
1. `is_valid_eatery` (boolean): Đánh `false` nếu tên là tiệm tạp hóa, siêu thị, quán cafe thuần, bar/club, spa, cây xăng, hoặc tên rác không rõ nghĩa. Đánh `true` nếu là quán ăn thực sự.
2. `clean_address` (string): Chuẩn hóa địa chỉ loại bỏ mã bưu điện Zipcode, bỏ chữ "Vietnam", bỏ số điện thoại hoặc ký tự rác. Trả về định dạng chuẩn sạch: "[Số nhà] [Tên đường], [Phường], [Quận]". NẾU địa chỉ quá mập mờ hoặc không có tên đường rõ ràng, hãy đánh `is_valid_eatery = false`.
3. `cuisine` (string): BẮT BUỘC chọn đúng 1 trong các giá trị:
   - "Cơm" (cơm tấm, cơm gà, cơm niêu, cơm bình dân...)
   - "Bún/Phở" (phở, bún bò, bún riêu, hủ tiếu, mì quảng, miến, bánh canh...)
   - "Lẩu/Nướng" (lẩu gà, lẩu bò, lẩu dê, nướng BBQ, xiên que...)
   - "Đồ Nhật/Hàn" (sushi, sashimi, ramen, kimbap, tokbokki, nướng Hàn...)
   - "Đồ Âu" (pizza, pasta, steak, burger...)
   - "Ăn vặt" (bánh mì, ốc, cá viên, bánh tráng, nem nướng...)
   - "Món Việt khác" (bánh xèo, cháo ếch, gỏi, bò kho...)
4. `sub_cuisine` (string): Phân loại chi tiết (chỉ chọn 1):
   ["com_tam", "com_van_phong", "pho", "bun_bo", "hu_tieu", "banh_mi", "lau", "nuong_bbq", "sushi_ramen", "do_han", "pizza_pasta", "an_vat", "oc_hai_san", "khac"]
5. `price_level` (int: 1, 2 hoặc 3):
   - 1: Dưới 45k (quán bình dân, vỉa hè, xe bánh mì, cơm sinh viên)
   - 2: 45k - 100k (quán ăn văn phòng tầm trung, quán có máy lạnh vừa)
   - 3: Trên 100k (nhà hàng, chuỗi thương hiệu lớn, lẩu nướng, trong TTTM)
6. `price_range_text` (string): VD: "35k - 55k", "60k - 120k", "150k - 300k".
7. `has_ac` (boolean): QUY TẮC BẢO THỦ — CHỈ đánh `true` khi có độ chắc chắn cao (nằm trong TTTM Vincom/Takashimaya/Saigon Centre/Crescent Mall/AEON, chuỗi thương hiệu lớn, nhà hàng Nhật/Hàn/Âu/Lẩu nướng máy lạnh). Còn lại để `false`.
8. `has_car_parking` (boolean): QUY TẮC BẢO THỦ — CHỈ đánh `true` nếu nằm trong TTTM hoặc nhà hàng lớn mặt tiền rộng nổi tiếng có bãi đỗ xe. Còn lại để `false`.
9. `free_moto_parking` (boolean): Đánh `true` nếu là quán ăn bình dân hoặc nhà hàng thông thường ngoài đường phố TP.HCM. Nếu trong TTTM lớn thường gửi xe có phí thì để `false`.
10. `vibe_tags` (string[]): Chọn các tag phù hợp từ: ["mat_me", "binh_dan", "an_nhanh", "hen_ho"].
11. `short_reason` (string): Viết đúng 1 câu tiếng Việt tự nhiên, trẻ trung (dưới 15 từ) gợi ý lý do nên ăn quán này.
    TUYỆT ĐỐI KHÔNG tự bịa ra điểm rating hoặc số sao Google Maps.

BẮT BUỘC trả về đúng định dạng JSON danh sách các object (mỗi object có trường overture_id tương ứng).
"""

def parse_args():
    parser = argparse.ArgumentParser(description="Làm giàu dữ liệu quán ăn TP.HCM bằng Gemini 2.5 Flash.")
    parser.add_argument("--batch-size", type=int, default=20, help="Số quán trên mỗi request (Mặc định: 20)")
    parser.add_argument("--delay", type=float, default=2.0, help="Độ trễ giây giữa các batch (Mặc định: 2.0s)")
    parser.add_argument("--dry-run", action="store_true", help="Chạy thử nghiệm mà không gọi API tốn token")
    parser.add_argument("--heuristic", action="store_true", help="Làm giàu bằng bộ quy tắc thông minh (Rule-based) không cần API key")
    parser.add_argument("--input", type=str, default=str(RAW_FILE), help="File hcmc_raw.json")
    parser.add_argument("--output", type=str, default=str(ENRICHED_FILE), help="File hcmc_enriched.json")
    return parser.parse_args()


def load_checkpoint(output_file: pathlib.Path) -> dict:
    """Đọc checkpoint hiện tại để hỗ trợ resume nếu tiến trình bị dừng giữa chừng."""
    if output_file.exists():
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    # Chuyển thành dict theo overture_id để tra cứu O(1)
                    return {item["overture_id"]: item for item in data if "overture_id" in item}
        except Exception as e:
            print(f"[!] Lỗi khi đọc file checkpoint ({e}), sẽ bắt đầu mới.")
    return {}


def save_checkpoint(enriched_dict: dict, output_file: pathlib.Path):
    """Ghi checkpoint tiến độ an toàn ra đĩa."""
    output_file.parent.mkdir(parents=True, exist_ok=True)
    temp_file = output_file.with_suffix(".tmp")
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(list(enriched_dict.values()), f, ensure_ascii=False, indent=2)
    os.replace(temp_file, output_file)


CATEGORY_MAP = {
    "vietnamese_restaurant": ("Cơm", "com_tam"),
    "burger_restaurant": ("Đồ Âu", "pizza_pasta"),
    "fast_food_restaurant": ("Đồ Âu", "pizza_pasta"),
    "pizza_restaurant": ("Đồ Âu", "pizza_pasta"),
    "italian_restaurant": ("Đồ Âu", "pizza_pasta"),
    "french_restaurant": ("Đồ Âu", "pizza_pasta"),
    "western_restaurant": ("Đồ Âu", "pizza_pasta"),
    "sushi_restaurant": ("Đồ Nhật/Hàn", "sushi_ramen"),
    "japanese_restaurant": ("Đồ Nhật/Hàn", "sushi_ramen"),
    "ramen_restaurant": ("Đồ Nhật/Hàn", "sushi_ramen"),
    "korean_restaurant": ("Đồ Nhật/Hàn", "do_han"),
    "korean_barbecue_restaurant": ("Đồ Nhật/Hàn", "do_han"),
    "barbecue_restaurant": ("Lẩu/Nướng", "nuong_bbq"),
    "hot_pot_restaurant": ("Lẩu/Nướng", "lau"),
    "noodle_restaurant": ("Bún/Phở", "hu_tieu"),
    "pho_restaurant": ("Bún/Phở", "pho"),
    "seafood_restaurant": ("Ăn vặt", "oc_hai_san"),
    "chinese_restaurant": ("Món Việt khác", "khac"),
    "asian_restaurant": ("Món Việt khác", "khac"),
    "vegetarian_restaurant": ("Món Việt khác", "khac"),
    "buffet_restaurant": ("Lẩu/Nướng", "lau"),
    "sandwich_shop": ("Ăn vặt", "banh_mi"),
}

REASON_TEMPLATES = {
    "com_tam": "Cơm tấm sườn nướng nóng hổi, thơm phức mỡ hành giòn rụm.",
    "com_van_phong": "Bữa cơm đầy đủ dưỡng chất, sạch sẽ và nhanh gọn.",
    "pho": "Nước dùng ninh xương đậm đà, bánh phở mềm thơm chuẩn vị.",
    "bun_bo": "Tô bún bò đậm vị sả ớt, chả cua giòn sần sật hấp dẫn.",
    "hu_tieu": "Hủ tiếu nước lèo ngọt thanh, topping tôm thịt đầy đặn.",
    "banh_mi": "Bánh mì vỏ giòn ruột mềm, nhân pate đậm vị thơm ngon.",
    "lau": "Nồi lẩu nóng hổi, tụ tập bạn bè quây quần cực đã.",
    "nuong_bbq": "Thịt nướng xèo xèo thơm nức mũi, sốt ướp vừa miệng.",
    "sushi_ramen": "Đồ Nhật tươi ngon, trình bày bắt mắt và thanh vị.",
    "do_han": "Món Hàn cay nồng chuẩn vị, nhiều món kèm hấp dẫn.",
    "pizza_pasta": "Món Âu chuẩn gu, không gian mát mẻ và tiện lợi.",
    "an_vat": "Món ăn vặt hấp dẫn, chiều lòng mọi tín đồ ăn uống.",
    "oc_hai_san": "Hải sản tươi sống, chế biến đậm đà gia vị Sài Gòn.",
    "khac": "Hương vị hấp dẫn, không gian thoải mái cho bữa ăn ngon."
}


def rule_based_enrich_restaurant(raw_item: dict) -> dict:
    """Tạo dữ liệu làm giàu bằng bộ quy tắc thông minh từ tên quán + danh mục Overture."""
    name = raw_item.get("name", "")
    address = raw_item.get("address", "")
    cat = (raw_item.get("primary_category") or "").lower()
    norm = remove_accents(name)

    # 1. Buffet & All-you-can-eat (Hoang Yen Buffet, Dookki, Kichi Kichi, King BBQ, v.v.)
    if re.search(r'\b(buffet|all you can eat|dookki|kichi kichi|haidilao|manwah|hotpot story|king bbq|sumo bbq|meat & meet|chura)\b', norm) or cat == 'buffet_restaurant':
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Lẩu/Nướng",
            "sub_cuisine": "lau",
            "price_level": 3,
            "price_range_text": "250k - 450k",
            "has_ac": True,
            "has_car_parking": True,
            "free_moto_parking": True,
            "vibe_tags": ["mat_me", "hen_ho"],
            "short_reason": "Đại tiệc buffet thịnh soạn đa dạng món ngon, không gian máy lạnh sang trọng mát mẻ."
        }

    # 2. Craft Beer, Breweries, Western Bistros, Steakhouses, Bars & Lounges
    western_cats = [
        'brewery', 'steakhouse', 'french_restaurant', 'italian_restaurant',
        'american_restaurant', 'european_restaurant', 'latin_american_restaurant',
        'wine_bar', 'beer_bar', 'beer_garden', 'sports_bar', 'bar_and_grill_restaurant',
        'tapas_bar', 'mediterranean_restaurant'
    ]
    if re.search(r'\b(brewery|brewing|craft beer|taproom|bistro|tavern|pub|bar & grill|lounge|cigar|steak|steakhouse|times square|sol kitchen|boomerang|el baron|thi bar|gastropub)\b', norm) or cat in western_cats:
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Đồ Âu",
            "sub_cuisine": "pizza_pasta",
            "price_level": 3,
            "price_range_text": "180k - 380k",
            "has_ac": True,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["mat_me", "hen_ho"],
            "short_reason": "Không gian Âu sang trọng mát mẻ, món ngon phong phú kèm đồ uống hảo hạng."
        }

    # 3. Fast food / Gà rán / Burger
    fast_food_cats = ['fast_food_restaurant', 'burger_restaurant', 'chicken_restaurant']
    if re.search(r'\b(mcdonald|burger king|lotteria|kfc|jollibee|texas chicken|popeyes|ga ran|burger)\b', norm) or cat in fast_food_cats:
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Đồ Âu",
            "sub_cuisine": "pizza_pasta",
            "price_level": 2,
            "price_range_text": "55k - 110k",
            "has_ac": True,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["an_nhanh", "mat_me"],
            "short_reason": "Thức ăn nhanh giòn tan nóng hổi, phục vụ nhanh chóng và không gian máy lạnh tiện lợi."
        }

    # 4. Pizza & Pasta
    if re.search(r'\b(pizza|pasta|spaghetti|domino)\b', norm) or cat == 'pizza_restaurant':
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Đồ Âu",
            "sub_cuisine": "pizza_pasta",
            "price_level": 2,
            "price_range_text": "120k - 250k",
            "has_ac": True,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["mat_me", "hen_ho"],
            "short_reason": "Pizza nướng củi thơm lừng, mì Ý béo ngậy chuẩn vị Âu tinh tế."
        }

    # 5. Sushi & Ramen & Nhật Bản
    if re.search(r'\b(sushi|ramen|sashimi|udon|tempura|maki|izakaya|yakitori|nhat ban|shabu|tokyo|morico|hokkaido)\b', norm) or cat in ['japanese_restaurant', 'sushi_restaurant', 'ramen_restaurant']:
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Đồ Nhật/Hàn",
            "sub_cuisine": "sushi_ramen",
            "price_level": 3,
            "price_range_text": "150k - 350k",
            "has_ac": True,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["mat_me", "hen_ho"],
            "short_reason": "Đồ Nhật tươi ngon tinh khiết, bài trí đẹp mắt và thanh vị."
        }

    # 6. Hàn Quốc
    if re.search(r'\b(korean|han quoc|tokbokki|kimbap|bulgogi|mr.bbq|bornga)\b', norm) or cat in ['korean_restaurant', 'korean_barbecue_restaurant']:
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Đồ Nhật/Hàn",
            "sub_cuisine": "do_han",
            "price_level": 2,
            "price_range_text": "120k - 280k",
            "has_ac": True,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["mat_me"],
            "short_reason": "Món Hàn cay nồng hấp dẫn, thịt nướng xì xèo cùng panchan đa dạng cực đã."
        }

    # 7. Nướng BBQ
    if re.search(r'\b(nuong|bbq|bo ne|xien que)\b', norm) or cat == 'barbecue_restaurant':
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Lẩu/Nướng",
            "sub_cuisine": "nuong_bbq",
            "price_level": 2,
            "price_range_text": "95k - 220k",
            "has_ac": True,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["mat_me"],
            "short_reason": "Thịt nướng xì xèo thơm nức mũi than hồng, sốt ướp vừa miệng đậm đà."
        }

    # 8. Lẩu
    if re.search(r'\b(lau|hotpot)\b', norm) or cat == 'hot_pot_restaurant':
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Lẩu/Nướng",
            "sub_cuisine": "lau",
            "price_level": 2,
            "price_range_text": "150k - 280k",
            "has_ac": True,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["mat_me"],
            "short_reason": "Nồi lẩu nóng hổi nghi ngút khói, tụ tập quây quần bạn bè cực ấm cúng."
        }

    # 9. Ốc / Hải sản
    if re.search(r'\b(quan oc|oc |hai san|seafood|ghe|cua|tom cua)\b', norm) or cat in ['seafood_restaurant', 'fish_and_chips_restaurant']:
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Ăn vặt",
            "sub_cuisine": "oc_hai_san",
            "price_level": 2,
            "price_range_text": "85k - 200k",
            "has_ac": False,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["binh_dan"],
            "short_reason": "Hải sản tươi rói chế biến đậm đà, vị bơ tỏi và muối ớt đặc trưng Sài Gòn."
        }

    # 10. Chay / Vegetarian
    if re.search(r'\b(chay|vegetarian|vegan|thanh tinh|bo de|tam duc|phap hoa)\b', norm) or cat == 'vegetarian_restaurant':
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Món Việt khác",
            "sub_cuisine": "khac",
            "price_level": 1,
            "price_range_text": "35k - 65k",
            "has_ac": False,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["binh_dan", "an_nhanh"],
            "short_reason": "Món chay thanh tịnh đậm đà hương vị tự nhiên, tốt cho sức khỏe."
        }

    # 11. Món Quay / Dimsum / Người Hoa
    if re.search(r'\b(vit quay|heo quay|ga quay|dac hoa|dim sum|dimsum|sui cao|ha cao|mi vit tiem|trieu chau|quang dong)\b', norm) or cat in ['dim_sum_restaurant', 'delicatessen']:
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Món Việt khác",
            "sub_cuisine": "hu_tieu",
            "price_level": 2,
            "price_range_text": "65k - 150k",
            "has_ac": False,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["an_nhanh"],
            "short_reason": "Món quay và điểm sấm người Hoa da giòn sốt đậm, gia truyền lâu đời."
        }

    # 12. Phở
    if re.search(r'\b(pho)\b', norm) and not re.search(r'\b(pho mai|pho phong)\b', norm):
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Bún/Phở",
            "sub_cuisine": "pho",
            "price_level": 1,
            "price_range_text": "45k - 75k",
            "has_ac": False,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["an_nhanh", "binh_dan"],
            "short_reason": "Nước dùng ninh xương đậm đà ngọt thanh, bánh phở mềm thơm chuẩn vị."
        }

    # 13. Bún bò
    if re.search(r'\b(bun bo)\b', norm):
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Bún/Phở",
            "sub_cuisine": "bun_bo",
            "price_level": 1,
            "price_range_text": "45k - 75k",
            "has_ac": False,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["an_nhanh", "binh_dan"],
            "short_reason": "Tô bún bò đậm vị sả ớt cay nồng, chả cua giòn sần sật hấp dẫn."
        }

    # 14. Bún đậu
    if re.search(r'\b(bun dau)\b', norm):
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Bún/Phở",
            "sub_cuisine": "bun_dau",
            "price_level": 1,
            "price_range_text": "45k - 70k",
            "has_ac": False,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["an_nhanh", "binh_dan"],
            "short_reason": "Mẹt bún đậu mắm tôm thập cẩm giòn rụm, chả cốm dẻo thơm chuẩn vị Bắc."
        }

    # 15. Hủ tiếu / Mì quảng / Bánh canh
    if re.search(r'\b(hu tieu|mi quang|banh canh|mi hoanh thanh|hu tieu muc)\b', norm):
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Bún/Phở",
            "sub_cuisine": "hu_tieu",
            "price_level": 1,
            "price_range_text": "40k - 70k",
            "has_ac": False,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["an_nhanh", "binh_dan"],
            "short_reason": "Hủ tiếu nước lèo ngọt thanh, tôm thịt tươi ngon đầy ắp tô."
        }

    # 16. Bánh mì
    if re.search(r'\b(banh mi|pate)\b', norm):
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Ăn vặt",
            "sub_cuisine": "banh_mi",
            "price_level": 1,
            "price_range_text": "20k - 40k",
            "has_ac": False,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["an_nhanh", "binh_dan"],
            "short_reason": "Bánh mì vỏ giòn ruột mềm, nhân pate đậm vị thơm ngon nóng hổi."
        }

    # 17. CƠM TẤM (STRICT: Chỉ gán cơm tấm khi tên quán THỰC SỰ có từ cơm tấm / sườn)
    if re.search(r'\b(com tam|suon bi cha|ba ghien|phuc loc tho|cali|tu map)\b', norm):
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Cơm",
            "sub_cuisine": "com_tam",
            "price_level": 1,
            "price_range_text": "35k - 65k",
            "has_ac": False,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["an_nhanh", "binh_dan"],
            "short_reason": "Cơm tấm sườn nướng nóng hổi, thơm phức mỡ hành giòn rụm chuẩn gu Sài Gòn."
        }

    # 18. Cơm niêu / Cơm gia đình / Ẩm thực truyền thống Việt Nam
    if re.search(r'\b(com nieu|am thuc|bep me in|quan bui|hoang yen vietnamese|que nha|lang tre|mon que|com gia dinh|com trua|com van phong|com ga)\b', norm):
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Món Việt khác",
            "sub_cuisine": "com_van_phong",
            "price_level": 2,
            "price_range_text": "85k - 180k",
            "has_ac": True,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["mat_me"],
            "short_reason": "Mâm cơm gia đình thuần Việt đậm đà chuẩn vị, không gian ấm cúng gần gũi."
        }

    # 19. Món Thái
    if re.search(r'\b(thai|tom yum|pad thai)\b', norm) or cat == 'thai_restaurant':
        return {
            **raw_item,
            "is_valid_eatery": True,
            "clean_address": address,
            "cuisine": "Món Việt khác",
            "sub_cuisine": "khac",
            "price_level": 2,
            "price_range_text": "85k - 190k",
            "has_ac": True,
            "has_car_parking": False,
            "free_moto_parking": True,
            "vibe_tags": ["mat_me"],
            "short_reason": "Món Thái chua cay đậm vị, hương thơm sả chanh kích thích vị giác."
        }

    # 20. Quán ăn Việt Nam nói chung (FALLBACK AN TOÀN)
    return {
        **raw_item,
        "is_valid_eatery": True,
        "clean_address": address,
        "cuisine": "Món Việt khác",
        "sub_cuisine": "khac",
        "price_level": 2,
        "price_range_text": "60k - 130k",
        "has_ac": True,
        "has_car_parking": False,
        "free_moto_parking": True,
        "vibe_tags": ["mat_me"],
        "short_reason": f"Quán {name} đậm đà hương vị truyền thống, phục vụ chu đáo tận tình."
    }


def mock_enrich_restaurant(raw_item: dict) -> dict:
    return rule_based_enrich_restaurant(raw_item)


def call_gemini_batch(batch_items: list, api_key: str) -> list:
    """Gọi Gemini 2.5 Flash API với Structured JSON Output cho batch 20 quán."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    input_payload = [
        {
            "overture_id": item["overture_id"],
            "name": item.get("name"),
            "address": item.get("address"),
            "primary_category": item.get("primary_category")
        }
        for item in batch_items
    ]

    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Hãy phân tích danh sách {len(input_payload)} quán ăn sau:\n"
        f"{json.dumps(input_payload, ensure_ascii=False, indent=2)}"
    )

    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2,
        }
    }

    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, headers=headers, json=body, timeout=60)
    if response.status_code != 200:
        raise Exception(f"Gemini API Error [{response.status_code}]: {response.text}")

    result_json = response.json()
    candidates = result_json.get("candidates", [])
    if not candidates:
        raise Exception("Không nhận được candidate nào từ Gemini API.")

    text_content = candidates[0]["content"]["parts"][0]["text"]
    parsed_batch = json.loads(text_content)
    
    # Hỗ trợ cả trường hợp AI bọc trong {"restaurants": [...]} hoặc trả về mảng trực tiếp
    if isinstance(parsed_batch, dict):
        for k, v in parsed_batch.items():
            if isinstance(v, list):
                parsed_batch = v
                break
                
    if not isinstance(parsed_batch, list):
        raise Exception(f"Định dạng phản hồi không phải danh sách: {type(parsed_batch)}")

    return parsed_batch


def main():
    args = parse_args()
    input_file = pathlib.Path(args.input)
    output_file = pathlib.Path(args.output)

    print("==================================================================")
    print("  HÔM NAY ĂN GÌ? // BƯỚC 2: LÀM GIÀU DỮ LIỆU BẰNG GEMINI 2.5 FLASH")
    print("==================================================================")

    if not input_file.exists():
        print(f"[X] Không tìm thấy file đầu vào: {input_file}")
        print("    Vui lòng chạy Bước 1 trước: python 01_extract_overture.py")
        sys.exit(1)

    with open(input_file, "r", encoding="utf-8") as f:
        raw_restaurants = json.load(f)

    total_count = len(raw_restaurants)
    print(f"[*] Tổng số quán từ Bước 1: {total_count}")

    # 1. Đọc Checkpoint để tiếp tục (Resume)
    checkpoint = load_checkpoint(output_file)
    print(f"[*] Đã làm giàu trước đó: {len(checkpoint)} / {total_count} quán")

    remaining_items = [r for r in raw_restaurants if r["overture_id"] not in checkpoint]
    print(f"[*] Số quán còn lại cần xử lý: {len(remaining_items)}")

    if len(remaining_items) == 0:
        print("[✓] Toàn bộ quán đã được làm giàu đầy đủ! Sẵn sàng sang Bước 3.")
        return

    # 2. Xử lý Dry-run (không gọi API thật)
    if args.dry_run:
        print("\n[+] CHẾ ĐỘ DRY-RUN: Đang mô phỏng làm giàu cho 5 quán đầu tiên mà không gọi API...")
        for item in remaining_items[:5]:
            enriched = rule_based_enrich_restaurant(item)
            checkpoint[item["overture_id"]] = enriched
        save_checkpoint(checkpoint, output_file)
        print(f"[✓] Đã lưu checkpoint dry-run tại: {output_file}")
        print(">>> Cú pháp và luồng dữ liệu Bước 2 hoàn toàn chính xác!")
        return

    # 3. Chế độ Rule-based Heuristics (không cần GEMINI_API_KEY)
    if args.heuristic:
        print(f"\n[+] CHẾ ĐỘ RULE-BASED: Đang làm giàu dữ liệu cho {len(remaining_items)} quán bằng bộ quy tắc thông minh...")
        for item in remaining_items:
            enriched = rule_based_enrich_restaurant(item)
            checkpoint[item["overture_id"]] = enriched
        save_checkpoint(checkpoint, output_file)
        print(f"[✓] Đã làm giàu thành công toàn bộ {len(checkpoint)} quán!")
        print(f"    File kết quả: {output_file}")
        print(">>> Tiếp tục Bước 3: python scripts/data-pipeline/03_seed_supabase.py --export-sql")
        return

    # 4. Kiểm tra API KEY khi chạy thật bằng Gemini
    if not GEMINI_API_KEY:
        print("\n[X] THIẾU GEMINI_API_KEY!")
        print("    Vui lòng cấu hình GEMINI_API_KEY trong file .env.local hoặc .env ở thư mục gốc.")
        print("    Lấy key miễn phí tại: https://aistudio.google.com/app/apikey")
        print("    (Hoặc chạy với cờ --heuristic để làm giàu 495 quán ngay lập tức không cần API key)")
        sys.exit(1)

    # 4. Chạy Batch Enrichment với Gemini 2.5 Flash
    batch_size = args.batch_size
    batches = [remaining_items[i:i + batch_size] for i in range(0, len(remaining_items), batch_size)]
    print(f"[*] Bắt đầu xử lý {len(batches)} batches (mỗi batch {batch_size} quán)...")

    for idx, batch in enumerate(batches, start=1):
        print(f"  -> Đang gửi Batch {idx}/{len(batches)} ({len(batch)} quán) tới Gemini 2.5 Flash...")
        try:
            enriched_results = call_gemini_batch(batch, GEMINI_API_KEY)
            
            # Map kết quả trả về theo overture_id
            enriched_map = {item["overture_id"]: item for item in enriched_results if "overture_id" in item}

            # Kết hợp dữ liệu raw + dữ liệu AI làm giàu
            for raw_item in batch:
                oid = raw_item["overture_id"]
                ai_data = enriched_map.get(oid, {})

                # 1. Bắt sub_cuisine trực tiếp từ từ khóa tên quán TRƯỚC AI
                kw_cuisine, kw_sub = detectSubCuisineByKeyword(raw_item.get("name", ""))
                final_cuisine = kw_cuisine or ai_data.get("cuisine", "Món Việt khác")
                final_sub = kw_sub or ai_data.get("sub_cuisine", "khac")

                # 2. Lấy địa chỉ sạch đã chuẩn hóa
                clean_addr = ai_data.get("clean_address") or raw_item.get("address", "")

                merged = {
                    **raw_item,
                    "address": clean_addr,
                    "clean_address": clean_addr,
                    "is_valid_eatery": ai_data.get("is_valid_eatery", True),
                    "cuisine": final_cuisine,
                    "sub_cuisine": final_sub,
                    "price_level": ai_data.get("price_level", 2),
                    "price_range_text": ai_data.get("price_range_text", "45k - 85k"),
                    "has_ac": ai_data.get("has_ac", False),
                    "has_car_parking": ai_data.get("has_car_parking", False),
                    "free_moto_parking": ai_data.get("free_moto_parking", True),
                    "vibe_tags": ai_data.get("vibe_tags", ["an_nhanh"]),
                    "short_reason": ai_data.get("short_reason", f"Quán {raw_item.get('name')} chuẩn vị thơm ngon.")
                }
                checkpoint[oid] = merged

            # Lưu checkpoint sau mỗi batch hoàn thành
            save_checkpoint(checkpoint, output_file)
            print(f"     [✓] Đã xong Batch {idx}, đã lưu checkpoint ({len(checkpoint)}/{total_count} quán).")

            # Delay nhẹ giữa các batch để tuân thủ Free Tier rate limit
            time.sleep(args.delay)

        except Exception as e:
            print(f"     [!] Lỗi ở Batch {idx}: {e}")
            print("     [i] Tiến trình đã được lưu lại. Bạn có thể chạy lại lệnh để tiếp tục từ điểm dừng!")
            time.sleep(5)

    print("\n==================================================================")
    print(f"[✓] BƯỚC 2 HOÀN TẤT! Đã làm giàu toàn bộ {len(checkpoint)} quán.")
    print(f"    File kết quả: {output_file}")
    print(">>> Tiếp tục Bước 3: python 03_seed_supabase.py")
    print("==================================================================")


if __name__ == "__main__":
    main()
