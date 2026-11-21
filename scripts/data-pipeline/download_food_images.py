#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tải và đóng gói 16 ảnh món ăn WebP chuẩn 4:3 vào thư mục public/images/food/
Phục vụ trải nghiệm Offline-First, 0ms load, không phụ thuộc mạng ngoài.
"""

import pathlib
import requests
import time

ROOT_DIR = pathlib.Path(__file__).parent.parent.resolve()
FOOD_DIR = ROOT_DIR / "public" / "images" / "food"
FOOD_DIR.mkdir(parents=True, exist_ok=True)

FOOD_IMAGES = {
    "com_tam": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "com_van_phong": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "pho": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "bun_bo": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "bun_dau": "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "hu_tieu": "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "banh_mi": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "lau": "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "nuong_bbq": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "sushi_ramen": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "do_han": "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "pizza_pasta": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "an_vat": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "oc_hai_san": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "khac": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=640&h=480&q=80&fm=webp",
    "default": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=640&h=480&q=80&fm=webp"
}

def main():
    print(f"[*] Bắt đầu tải {len(FOOD_IMAGES)} ảnh món ăn WebP 4:3 vào {FOOD_DIR}...")
    success = 0
    headers = {"User-Agent": "HomNayAnGi-App/1.0"}

    for name, url in FOOD_IMAGES.items():
        dest = FOOD_DIR / f"{name}.webp"
        print(f"  -> Đang tải {name}.webp ...", end="", flush=True)
        try:
            r = requests.get(url, headers=headers, timeout=15)
            if r.status_code == 200 and len(r.content) > 1000:
                with open(dest, "wb") as f:
                    f.write(r.content)
                size_kb = len(r.content) / 1024
                print(f" [OK] ({size_kb:.1f} KB)")
                success += 1
            else:
                print(f" [FAIL: status {r.status_code}]")
        except Exception as e:
            print(f" [ERR: {e}]")
        time.sleep(0.3)

    print(f"\n[✓] Đã tải thành công {success}/{len(FOOD_IMAGES)} ảnh WebP vào public/images/food/")

if __name__ == "__main__":
    main()
